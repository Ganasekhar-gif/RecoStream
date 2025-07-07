from fastapi import FastAPI
from . import models
from .database import engine
from .routers import user, auth
from .routers import recommendation
from .routers import feedback

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(user.router)
app.include_router(auth.router)
app.include_router(recommendation.router)
app.include_router(feedback.router)

@app.get("/")
def read_root():
    return {"message": "API is up and running!"}



