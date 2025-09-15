from fastapi import APIRouter, Body
from pydantic import BaseModel
from fastapi import APIRouter, Body
from .. import hybrid

router = APIRouter()

# Define a request schema for cleaner handling
class RecommendationRequest(BaseModel):
    user_input: str
    user_id: int  # For personalizing recommendations

@router.post("/recommend/")
def get_recommendations(user_input: str = Body(..., embed=True), user_id: int = Body(...)):
    return hybrid.hybrid_recommend(user_id=user_id, user_input=user_input)