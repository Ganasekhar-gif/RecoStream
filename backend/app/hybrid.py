from . import recommender, cf

def hybrid_recommend(user_id: int, user_input: str, top_k: int = 5, alpha: float = 0.6):
    """
    Combines BERT similarity and Collaborative Filtering scores.
    
    Parameters:
        user_id (int): ID of the user.
        user_input (str): User's input (query or preference).
        top_k (int): Number of recommendations to return.
        alpha (float): Weight for BERT score (0.0 to 1.0).
                       (1 - alpha) is used for collaborative score.
    
    Returns:
        List of movie recommendations sorted by combined score.
    """
    # Step 1: Get semantic recommendations
    bert_results = recommender.recommend_movies(user_input, top_k=10)  # Fetch more to filter
    
    hybrid_results = []
    for result in bert_results:
        movie_title = result["title"]
        bert_score = result["score"]
        cf_score = cf.get_cf_score(user_id, movie_title)

        # Combine both scores
        combined_score = alpha * bert_score + (1 - alpha) * cf_score

        hybrid_results.append({
            "title": movie_title,
            "description": result["description"],
            "bert_score": round(bert_score, 3),
            "cf_score": round(cf_score, 3),
            "score": round(combined_score, 3)
        })

    # Sort by combined score
    hybrid_results.sort(key=lambda x: x["score"], reverse=True)
    return hybrid_results[:top_k]
