from sentence_transformers import SentenceTransformer, util
import json
import os
from .database import SessionLocal
from . import models

# Load BERT model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Load movie data
base_dir = os.path.dirname(__file__)
file_path = os.path.join(base_dir, "movie_data.json")

with open(file_path, "r", encoding="utf-8") as f:
    movies = json.load(f)

# Compute embeddings
descriptions = [f"{movie['description']} Genre: {movie['genre']}" for movie in movies]
embeddings = model.encode(descriptions, convert_to_tensor=True)


def get_user_feedback(user_id):
    db = SessionLocal()
    feedback_entries = db.query(models.Feedback).filter(models.Feedback.user_id == user_id).all()
    db.close()
    return feedback_entries


def recommend_movies(user_input, user_id=None, top_k=3):
    user_embedding = model.encode(user_input, convert_to_tensor=True)
    similarities = util.cos_sim(user_embedding, embeddings)[0]

    # Personalization via user feedback
    if user_id is not None:
        feedback_entries = get_user_feedback(user_id)
        liked_ids = {f.movie_id for f in feedback_entries if f.feedback_type == "like"}
        disliked_ids = {f.movie_id for f in feedback_entries if f.feedback_type == "dislike"}

        # Adjust similarity scores
        for i, movie in enumerate(movies):
            movie_id = movie.get("id", i)  # fallback to index
            if movie_id in liked_ids:
                similarities[i] += 0.1
            elif movie_id in disliked_ids:
                similarities[i] -= 0.1

    # Get top-k
    top_indices = similarities.argsort(descending=True)[:top_k]

    results = []
    for idx in top_indices:
        movie = movies[int(idx)]
        results.append({
            "title": movie["title"],
            "description": movie["description"],
            "score": round(float(similarities[idx]), 3)
        })
    return results
