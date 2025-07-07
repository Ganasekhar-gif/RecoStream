from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from .. import database, cf

router = APIRouter(prefix="/feedback", tags=["Feedback"])

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
    cf.retrain_cf_model()
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
    return {"message": "Click tracked"}

