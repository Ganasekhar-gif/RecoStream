import pandas as pd
from surprise import Dataset, Reader, KNNBasic
from sqlalchemy.orm import Session
from . import models, database

model = None  # Global model object


def feedback_to_score(feedback_type: str) -> float:
    if feedback_type == "like":
        return 1.0
    elif feedback_type == "click":
        return 0.8
    elif feedback_type == "dislike":
        return 0.0
    return 0.5


# Load feedbacks from DB
def load_feedbacks_from_db():
    db: Session = database.SessionLocal()
    feedbacks = db.query(models.Feedback).all()
    db.close()

    return pd.DataFrame([{
        "user_id": feedback.user_id,
        "movie_id": feedback.movie_id,
        "feedback": feedback_to_score(feedback.feedback_type)
    } for feedback in feedbacks])


def retrain_cf_model():
    global model
    df = load_feedbacks_from_db()
    
    if df.empty:
        model = None
        return  # Avoid training on empty data

    reader = Reader(rating_scale=(0, 1))
    data = Dataset.load_from_df(df[["user_id", "movie_id", "feedback"]], reader)
    trainset = data.build_full_trainset()

    model = KNNBasic(sim_options={"user_based": True})
    model.fit(trainset)


def get_cf_score(user_id, movie_id):
    if model is None:
        return 0.0
    try:
        prediction = model.predict(user_id, movie_id)
        return prediction.est
    except Exception:
        return 0.0

