import random
from collections import defaultdict
from . import recommender, cf

# Global bandit storage (in-memory for now)
bandit_counts = defaultdict(int)   # how many times a movie was shown
bandit_rewards = defaultdict(float)  # total reward for a movie

EPSILON = 0.2  # 20% explore, 80% exploit


def update_bandit(movie_id: int, reward: float):
    """
    Update bandit stats when feedback is received.
    Reward: 1.0 = like, 0.8 = click, 0.0 = dislike
    """
    bandit_counts[movie_id] += 1
    bandit_rewards[movie_id] += reward


def select_with_bandit(candidates, top_k=10):
    """
    Apply ε-Greedy to select recommendations from candidates.
    """
    # Exploit: pick best scored movies
    exploit_results = sorted(candidates, key=lambda x: x["score"], reverse=True)[:top_k]

    # Explore: sometimes swap in a random movie
    final_results = []
    for item in exploit_results:
        if random.random() < EPSILON:  # explore
            random_choice = random.choice(candidates)
            final_results.append(random_choice)
        else:  # exploit
            final_results.append(item)

    return final_results


def hybrid_recommend(user_id: int, user_input: str, top_k: int = 10, alpha: float = 0.6):
    """
    Combines BERT similarity and Collaborative Filtering scores with ε-Greedy Bandits.
    
    Parameters:
        user_id (int): ID of the user.
        user_input (str): User's input (query or preference).
        top_k (int): Number of recommendations to return.
        alpha (float): Weight for BERT score (0.0 to 1.0).
                       (1 - alpha) is used for collaborative score.
    
    Returns:
        List of movie recommendations sorted by bandit-adjusted scores.
    """
    # Step 1: Get semantic recommendations
    bert_results = recommender.recommend_movies(user_input, top_k=20)  # fetch more for bandit exploration

    hybrid_results = []
    for result in bert_results:
        movie_id = result["id"]
        movie_title = result["title"]
        bert_score = result["score"]
        cf_score = cf.get_cf_score(user_id, movie_id)

        # Combine both scores
        combined_score = alpha * bert_score + (1 - alpha) * cf_score

        # Compute average reward if available
        avg_reward = bandit_rewards[movie_id] / (bandit_counts[movie_id] + 1e-5)

        # Adjust score slightly with reward history
        adjusted_score = 0.9 * combined_score + 0.1 * avg_reward

        hybrid_results.append({
            "id": movie_id,
            "title": movie_title,
            "description": result["description"],
            "bert_score": round(bert_score, 3),
            "cf_score": round(cf_score, 3),
            "score": round(adjusted_score, 3)
        })

    # Step 2: Use ε-Greedy to select final recommendations
    final_recommendations = select_with_bandit(hybrid_results, top_k=top_k)
    return final_recommendations
