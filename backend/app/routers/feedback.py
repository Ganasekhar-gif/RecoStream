from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from .. import database, cf
from ..hybrid import update_bandit, bandit_counts, bandit_rewards  # import bandit stats

router = APIRouter(prefix="/feedback", tags=["Feedback"])


def feedback_to_reward(feedback_type: str) -> float:
    """Map feedback type to bandit reward."""
    if feedback_type == "like":
        return 1.0
    elif feedback_type == "click":
        return 0.8
    elif feedback_type == "dislike":
        return 0.0
    return 0.5  # neutral fallback


@router.post("/")
def give_feedback(feedback: schemas.FeedbackCreate, db: Session = Depends(database.get_db)):
    feedback_entry = models.Feedback(
        user_id=feedback.user_id,
        movie_id=feedback.movie_id,
        feedback_type=feedback.feedback_type
    )
    db.add(feedback_entry)
    db.commit()
    db.refresh(feedback_entry)

    # Retrain CF model
    cf.retrain_cf_model()

    # Update Bandit with reward
    reward = feedback_to_reward(feedback.feedback_type)
    update_bandit(feedback.movie_id, reward)

    return {"message": "Feedback recorded successfully"}


@router.post("/feedback/click/")
def track_click(user_id: int, movie_id: int, db: Session = Depends(database.get_db)):
    existing = db.query(models.Feedback).filter_by(
        user_id=user_id,
        movie_id=movie_id,
        feedback_type="click"
    ).first()

    if existing:
        return {"message": "Click already recorded"}

    feedback = models.Feedback(user_id=user_id, movie_id=movie_id, feedback_type="click")
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    # Retrain CF model
    cf.retrain_cf_model()

    # Update Bandit with reward for click
    update_bandit(movie_id, 0.8)

    return {"message": "Click tracked"}


@router.get("/stats/{user_id}")
def feedback_stats(user_id: int, db: Session = Depends(database.get_db)):
    """
    Get feedback stats for a particular user including DB entries and bandit stats.
    """
    feedbacks = db.query(models.Feedback).filter(models.Feedback.user_id == user_id).all()

    if not feedbacks:
        raise HTTPException(status_code=404, detail="No feedback found for this user")

    feedback_list = [
        {
            "movie_id": f.movie_id,
            "feedback_type": f.feedback_type,
            "bandit_count": bandit_counts.get(f.movie_id, 0),
            "bandit_reward": round(bandit_rewards.get(f.movie_id, 0.0), 3)
        }
        for f in feedbacks
    ]

    return {
        "user_id": user_id,
        "total_feedback": len(feedbacks),
        "feedbacks": feedback_list
    }
