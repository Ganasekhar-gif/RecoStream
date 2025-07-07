from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

# ✅ New Feedback Table
class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))  # Reference to users table
    movie_id = Column(Integer)  # You can keep this as int assuming movie IDs are unique
    feedback_type = Column(String)  # e.g. "like", "dislike", or "rating"
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
