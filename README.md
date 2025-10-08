# 🎬 RecoStream: Emotion + Behavior Aware Recommendation System

RecoStream is a full‑stack, Netflix‑style recommendation system that provides **personalized movie suggestions** based on a user’s preferences, behaviors, and the semantic meaning of their inputs.

It combines **Sentence‑BERT** semantic search with **Collaborative Filtering (Surprise)** and a **feedback loop** (like/dislike/click). The project exposes a FastAPI backend and a modern React frontend.

Linkedin Post Link: https://www.linkedin.com/posts/ganasekhark_machinelearning-recommendationsystems-ai-activity-7374888182980653056-ozCa?utm_source=share&utm_medium=member_desktop&rcm=ACoAAD89BZIBRKWU64_jsUAxvhPir2TtHKAUOXY

---

## 📌 Features

| Module                        | Description                                                                 |
|------------------------------|-----------------------------------------------------------------------------|
| 👤 User Auth                 | Secure login/signup using hashed passwords and JWT tokens                   |
| 📽 Movie Recommender         | Semantic similarity via Sentence-BERT + genre filtering                     |
| 📊 Collaborative Filtering   | Learns from user likes/dislikes/clicks using Surprise KNN                   |
| 🧠 Emotion Awareness         | Recommends based on user tone: e.g., "I want a feel-good sci-fi movie"      |
| 🔁 Feedback Loop             | Logs "like", "dislike", and "click" feedback for model improvement          |
| 🚀 Scalable Backend          | FastAPI backend with modular architecture                                   |
| 💬 Explainability            | "Because you liked Interstellar and it had a sci-fi genre..."               |

---

## ⚙️ Tech Stack

| Layer        | Tools                                                                 |
|--------------|-----------------------------------------------------------------------|
| Frontend     | React (Vite, Tailwind, Framer Motion, Axios)                          |
| Backend      | FastAPI, SQLAlchemy, JWT, Pydantic                                    |
| Recommender  | Sentence-BERT, Surprise (Collaborative Filtering), Vowpal Wabbit (RL) |
| Storage      | Local files (JSON/NumPy/FAISS index)                                  |

---

## 📁 Project Structure

```
RecoStream/
├── backend/
│   └── app/
│       ├── main.py                 # FastAPI entrypoint
│       ├── database.py             # DB connection
│       ├── models.py               # ORM models (User, Feedback)
│       ├── schemas.py              # Pydantic schemas
│       ├── recommender.py          # BERT/FAISS, incremental index update
│       ├── hybrid.py               # (Optional) hybrid logic
│       └── routers/
│           ├── user.py             # Signup API
│           ├── auth.py             # Login/auth API
│           ├── recommendation.py   # Recommendation API (single endpoint)
│           └── feedback.py         # Like/Dislike/Click endpoints
├── frontend/
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── utils/api.js            # Axios, endpoints, poster helpers
│       ├── contexts/               # Auth, Toast, Profile contexts
│       ├── components/             # MovieCard, MovieModal, MovieGrid, Layout
│       └── pages/                  # Home, Search, Genre, Profile, Login, Signup
├── requirements.txt                # Python dependencies (install with conda)
├── .env                            # Backend environment variables
├── DockerFile
├── docker-compose.yml
├── build-and-deploy.sh
├── init.sql
├── .env.docker                        
└── README.md

```

## 🧱 System Architecture

![recommendation_architecture](https://github.com/user-attachments/assets/dfe8cd51-7bf1-41cc-b5bf-adc3b4db0121)

---

## 🚀 Local Development Setup

The commands below assume you are in the project root: `RecoStream/`.

### 1) Prerequisites
- Anaconda/Miniconda installed (for the `recostream` environment)
- Node.js 18+

### 2) Create and activate the conda environment
```bash
conda create -n recostream python=3.10 -y
conda activate recostream
```

### 3) Install backend dependencies (via conda)
Use conda to install dependencies from `requirements.txt`.

```bash
conda activate recostream
conda install --file requirements.txt -c conda-forge -y
# If any packages are missing on conda, you can fallback to pip:
# pip install -r requirements.txt
```

### 4) Configure backend environment variables
```env
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
# Add any other keys required by your app
```

Create this `.env` file at `backend/app/.env` or load using your preferred config strategy.

### 5) Run the backend (from project root)
```bash
conda activate recostream
uvicorn backend.app.main:app --reload
```

The API will be available at: http://127.0.0.1:8000

Interactive docs: http://127.0.0.1:8000/docs

### 6) Run the frontend (in a second terminal)
```bash
conda activate recostream
cd frontend
npm install
npm run dev
```

By default Vite will start on: http://localhost:5173

---

## Docker Deployment

For quick setup using Docker and Docker Compose:
```bash
# Build and start all services
docker-compose up --build

# Access the app
# - Frontend: http://localhost:5173
# - API docs: http://localhost:8000/docs

```

To Stop Services:
```bash
docker-compose down
```

use the optional deployment script for advanced management:
```bash
./build-and-deploy.sh build
./build-and-deploy.sh prod

```

## ✅ Current Capabilities

- ✅ User Signup/Login (JWT)
- ✅ BERT-based recommendations
- ✅ Feedback logging (like/dislike/click)
- ✅ Collaborative Filtering with Surprise
- ✅ Feedback-based learning
- ✅ Modular FastAPI backend

---

## 🧪 Example API Usage

### POST `/recommend/`
```json
{
  "user_input": "I like sci-fi space movies"
}
```

### Response
```json
[
  {"title": "Interstellar", "score": 0.401},
  {"title": "Spaceman", "score": 0.323},
  {"title": "Shutter Island", "score": 0.182}
]
```

---

## 🧠 Future Work (Planned)

| Feature                               | Status        |
|---------------------------------------|---------------|
| 🤖 Reinforcement Learning (VW)        | 🚧 In Progress |
| 📈 Dynamic CF Retraining              | ✅ Done        |
| 🧾 Movie-to-ID Mapping                | ✅ Done        |
| 🎯 Learnable Ranking (BERT + CF)      | ✅ Hybrid done |
| 🧍 User Clustering                    | 🔜 Planned     |
| 📱 Frontend UI (React)                | ✅ Implemented  |
| 🛡️ OAuth + Refresh Tokens             | 🔜 Planned     |

---

## 🎯 Roadmap

- ✅ Integrate Vowpal Wabbit into `/bandit_recommend` route  
- ✅ Track real-time feedback for Bandit reward learning  
- ⏳ Retrain VW model incrementally on new interactions  
- 🔮 Add visual analytics (feedback trends, popular genres)  
- 📲 Build mobile-ready frontend with personalized dashboards  

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss your ideas.

---

## 📄 License

This project is open-source under the MIT License.

---

## ✨ Inspiration

---

## 🔧 Troubleshooting

- **CORS errors during local dev**
  - Ensure the FastAPI CORS middleware allows `http://localhost:5173`.

- **Missing posters**
  - The frontend uses `poster_path` returned by the backend. If a movie has no poster, a placeholder is shown.

- **Profile shows movie ID instead of title**
  - Ensure the backend feedback stats endpoint returns `movie_title` and `movie_year` for each feedback entry (join with your movie dataset or store these values at feedback time).

- **FAISS index updates**
  - Add new movies to the source JSON used by `recommender.py` and call the update function (e.g., expose an admin route that calls `update_faiss_index()` to append to the index without full rebuild).

Inspired by Netflix, Spotify, and real-world hybrid recommender systems with:

- NLP + emotion modeling  
- Collaborative filtering  
- Online learning (bandits)


---

💬 Built with passion for learning how recommendation systems like Netflix actually work —  
blending machine learning, software engineering, and personalization.

---