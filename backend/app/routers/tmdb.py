import os
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv

# Load env vars
load_dotenv()

router = APIRouter(prefix="/tmdb", tags=["TMDB"])

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

# ✅ Reuse session with retry logic
session = requests.Session()
retry = Retry(
    total=5,
    backoff_factor=1,
    status_forcelist=[429, 500, 502, 503, 504],  # include 429 (rate limit)
)
adapter = HTTPAdapter(max_retries=retry)
session.mount("https://", adapter)


@router.get("/poster")
def get_movie_poster(title: str, year: int | None = None):
    """
    Fetch movie poster from TMDB API using backend proxy.
    Falls back gracefully if no poster is found.
    """
    if not TMDB_API_KEY:
        raise HTTPException(status_code=500, detail="TMDB_API_KEY not configured")

    try:
        params = {
            "api_key": TMDB_API_KEY,
            "query": title,
            "include_adult": False,
        }
        if year:
            params["year"] = year

        response = session.get(f"{TMDB_BASE_URL}/search/movie", params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get("results"):
            poster_path = data["results"][0].get("poster_path")
            if poster_path:
                return {"poster_url": f"{TMDB_IMAGE_BASE_URL}{poster_path}"}

        return {"poster_url": None}  # No poster found

    except requests.exceptions.SSLError as e:
        raise HTTPException(status_code=500, detail=f"SSL error: {str(e)}")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"TMDB request failed: {str(e)}")
