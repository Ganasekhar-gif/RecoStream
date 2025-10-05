from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine
from .routers import user, auth
from .routers import recommendation
from .routers import feedback
from . import recommender
from .routers import tmdb

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

app.include_router(user.router)
app.include_router(auth.router)
app.include_router(recommendation.router)
app.include_router(feedback.router)
app.include_router(tmdb.router)

@app.get("/")
def read_root():
    return {"message": "API is up and running!"}

@app.post("/update_index")
def update_index():
    """
    Endpoint to update FAISS index if new movies are added.
    """
    recommender.update_faiss_index()
    return {"status": "success", "message": "FAISS index updated with new movies."}



