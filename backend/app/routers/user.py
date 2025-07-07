from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, database
from .. import utils  # ✅ use your combined utils file

router = APIRouter(
    prefix="/user",
    tags=["Users"]
)

@router.post("/", response_model=schemas.ShowUser)
def create_user(request: schemas.UserCreate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = utils.hash_password(request.password)  # ✅ using utils.py
    new_user = models.User(email=request.email, hashed_password=hashed_password)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user
