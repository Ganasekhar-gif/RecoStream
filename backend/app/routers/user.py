from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .. import models, schemas, database
from .. import utils

router = APIRouter(
    prefix="/user",
    tags=["Users"]
)

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(database.get_db)):
    """
    Get current user from JWT token
    """
    try:
        token = credentials.credentials
        payload = utils.verify_access_token(token)
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = db.query(models.User).filter(models.User.email == email).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/", response_model=schemas.ShowUser)
def create_user(request: schemas.UserCreate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = utils.hash_password(request.password)
    new_user = models.User(email=request.email, hashed_password=hashed_password)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.get("/me", response_model=schemas.ShowUser)
def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    """
    Get current authenticated user information
    """
    return current_user


@router.get("/stats")
def get_user_stats(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    """
    Get user statistics for profile page
    """
    total_feedback = db.query(models.Feedback).filter(models.Feedback.user_id == current_user.id).count()
    likes = db.query(models.Feedback).filter(
        models.Feedback.user_id == current_user.id,
        models.Feedback.feedback_type == "like"
    ).count()
    dislikes = db.query(models.Feedback).filter(
        models.Feedback.user_id == current_user.id,
        models.Feedback.feedback_type == "dislike"
    ).count()
    
    recent_feedback = db.query(models.Feedback).filter(
        models.Feedback.user_id == current_user.id
    ).order_by(models.Feedback.timestamp.desc()).limit(10).all()
    
    return {
        "total_feedback": total_feedback,
        "likes": likes,
        "dislikes": dislikes,
        "feedback_distribution": [
            {"name": "Likes", "value": likes},
            {"name": "Dislikes", "value": dislikes},
            {"name": "Views", "value": max(0, total_feedback - likes - dislikes)}
        ],
        "recent_feedback": [
            {
                "movie_title": f"Movie {fb.movie_id}",  # replace with actual movie lookup later
                "movie_year": "2023",
                "feedback_type": fb.feedback_type,
                "created_at": fb.timestamp.isoformat()
            }
            for fb in recent_feedback
        ],
        "top_movies": [
            {"title": "Sample Movie 1", "score": 8.5},
            {"title": "Sample Movie 2", "score": 8.2},
            {"title": "Sample Movie 3", "score": 7.9}
        ]
    }
