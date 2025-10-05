from sentence_transformers import SentenceTransformer
import json
import os
import faiss
import numpy as np
from .database import SessionLocal
from . import models

# ----------------------------
# Load BERT model
# ----------------------------
model = SentenceTransformer('all-MiniLM-L6-v2')

# ----------------------------
# File paths
# ----------------------------
base_dir = os.path.dirname(__file__)
file_path = os.path.join(base_dir, "new_movies.json")
index_file = os.path.join(base_dir, "faiss_index.bin")
embeddings_file = os.path.join(base_dir, "movie_embeddings.npy")
ids_file = os.path.join(base_dir, "movie_ids.npy")

# ----------------------------
# Load movie data
# ----------------------------
with open(file_path, "r", encoding="utf-8") as f:
    movies = json.load(f)

# ----------------------------
# Load or Build FAISS Index
# ----------------------------
if os.path.exists(index_file) and os.path.exists(embeddings_file) and os.path.exists(ids_file):
    print("Loading FAISS index and embeddings...")
    index = faiss.read_index(index_file)
    embeddings = np.load(embeddings_file)
    stored_ids = np.load(ids_file).tolist()
else:
    print("Building FAISS index from scratch...")
    descriptions = [f"{movie['description']} Genre: {movie['genres']}" for movie in movies]
    embeddings = model.encode(descriptions, convert_to_numpy=True, show_progress_bar=True)

    # Normalize for cosine similarity
    faiss.normalize_L2(embeddings)

    # Build index
    d = embeddings.shape[1]
    index = faiss.IndexFlatIP(d)
    index.add(embeddings)

    # Save files
    np.save(embeddings_file, embeddings)
    np.save(ids_file, [m["id"] for m in movies])
    faiss.write_index(index, index_file)
    stored_ids = [m["id"] for m in movies]

# ----------------------------
# Update function for new movies
# ----------------------------
def update_faiss_index():
    global movies, embeddings, index, stored_ids

    with open(file_path, "r", encoding="utf-8") as f:
        latest_movies = json.load(f)

    # Detect new movies by ID
    latest_ids = {m["id"] for m in latest_movies}
    existing_ids = set(stored_ids)
    new_movies = [m for m in latest_movies if m["id"] not in existing_ids]

    if not new_movies:
        print("No new movies to add.")
        return

    print(f"Found {len(new_movies)} new movies. Updating FAISS index...")

    # Compute embeddings for new movies
    new_descriptions = [f"{m['description']} Genre: {m['genres']}" for m in new_movies]
    new_embeddings = model.encode(new_descriptions, convert_to_numpy=True, show_progress_bar=True)
    faiss.normalize_L2(new_embeddings)

    # Add to FAISS index
    index.add(new_embeddings)

    # Update memory + save
    movies.extend(new_movies)
    stored_ids.extend([m["id"] for m in new_movies])
    embeddings = np.vstack([embeddings, new_embeddings])

    np.save(embeddings_file, embeddings)
    np.save(ids_file, stored_ids)
    faiss.write_index(index, index_file)

    print("FAISS index updated successfully!")

# ----------------------------
# User Feedback
# ----------------------------
def get_user_feedback(user_id):
    db = SessionLocal()
    feedback_entries = db.query(models.Feedback).filter(models.Feedback.user_id == user_id).all()
    db.close()
    return feedback_entries

# ----------------------------
# Recommendations
# ----------------------------
def recommend_movies(user_input, user_id=None, top_k=10):
    # Encode query
    user_embedding = model.encode(user_input, convert_to_numpy=True)
    faiss.normalize_L2(user_embedding.reshape(1, -1))

    # Search in FAISS index
    scores, indices = index.search(user_embedding.reshape(1, -1), top_k)
    scores, indices = scores[0], indices[0]

    results = []
    for score, idx in zip(scores, indices):
        movie = movies[int(idx)]
        final_score = float(score)

        # Personalization via feedback
        if user_id is not None:
            feedback_entries = get_user_feedback(user_id)
            liked_ids = {f.movie_id for f in feedback_entries if f.feedback_type == "like"}
            disliked_ids = {f.movie_id for f in feedback_entries if f.feedback_type == "dislike"}

            if movie["id"] in liked_ids:
                final_score += 0.1
            elif movie["id"] in disliked_ids:
                final_score -= 0.1

        results.append({
            "id": movie["id"],
            "title": movie["title"],
            "year": movie.get("year"),
            "description": movie["description"],
            "poster_path": movie.get("poster_path"),
            "rating": movie.get("rating"),
            "score": round(final_score, 3)
        })

    # Sort after personalization
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]
