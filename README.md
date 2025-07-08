# 🎬 RecoStream: Emotion + Behavior Aware Recommendation System

RecoStream is a full-stack, Netflix-style recommendation system that provides **personalized content and product suggestions** based on a user's preferences, behaviors, and emotional tone of inputs.

This system combines **BERT-based semantic recommendations** with **Collaborative Filtering** and is designed for future enhancement using **Reinforcement Learning with Vowpal Wabbit**.

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
| Frontend     | React.js (in progress) / Streamlit (optional prototype)              |
| Backend      | FastAPI, PostgreSQL, SQLAlchemy, JWT, Pydantic                        |
| Recommender  | Sentence-BERT, Surprise (Collaborative Filtering), Vowpal Wabbit (RL) |
| Hosting      | Docker, Render/Heroku/EC2 (your choice)                               |

---

## 📁 Project Structure

```
netflix/
├── app/
│   ├── main.py                  # FastAPI entrypoint
│   ├── database.py              # DB connection setup
│   ├── models.py                # ORM models (User, Feedback)
│   ├── utils.py                 # JWT + password hashing
│   ├── recommender.py           # BERT-based semantic recommender
│   ├── cf.py                    # Collaborative filtering recommender
│   ├── hybrid.py                # Combines BERT + CF (hybrid logic)
│   ├── routers/
│   │   ├── user.py              # Signup API
│   │   ├── auth.py              # Login/auth API
│   │   ├── recommendation.py    # Recommender API
│   │   └── feedback.py          # Like/Dislike/Click tracking
├── movie_data.json              # Static movie descriptions + genres
├── ratings.csv                  # Sample user-movie interactions
├── .env                         # Secure keys and DB connection
```

## 🧱 System Architecture

![recommendation_architecture](https://github.com/user-attachments/assets/dfe8cd51-7bf1-41cc-b5bf-adc3b4db0121)

---

## 🚀 Setup Instructions

### 1. Clone the repo
```bash
git clone https://github.com/your-username/reco-stream.git
cd reco-stream/backend
```

### 2. Setup Python environment
```bash
python -m venv venv
venv\Scripts\activate       # Windows
# or
source venv/bin/activate    # macOS/Linux

pip install -r requirements.txt
```

> ⚠️ Note: If vowpalwabbit fails to install on Windows, use a prebuilt wheel from Gohlke's repo.

### 3. Create `.env`
```env
DATABASE_URL=postgresql://postgres:<your-password>@localhost:5432/recommender
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 4. Run the backend
```bash
uvicorn app.main:app --reload
```

### 5. Access API Docs
Open http://127.0.0.1:8000/docs in your browser.

---

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
| 📱 Frontend UI (React or Streamlit)   | 🔜 Planned     |
| 🛡️ OAuth + Refresh Tokens             | 🔜 Planned     |

---

## 🎯 Next Steps

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

Inspired by Netflix, Spotify, and real-world hybrid recommender systems with:

- NLP + emotion modeling  
- Collaborative filtering  
- Online learning (bandits)
