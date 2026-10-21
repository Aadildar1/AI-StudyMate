# 🎓 AI StudyMate

An AI-powered learning platform that generates personalized study material, quizzes, performance analysis, and AI tutoring to help students learn any topic more effectively.

## 🚀 Live Demo

**Frontend:** https://ai-study-mate-xi.vercel.app

**Backend API:** https://ai-studymate-rl3v.onrender.com

---

## 📖 Overview

AI StudyMate is a full-stack web application that uses Google's Gemini AI to create customized learning experiences.

Users can:

- 📚 Generate AI-powered lessons on any topic
- 📝 Take automatically generated quizzes
- 📊 Receive AI-generated performance analysis
- 💬 Chat with an AI tutor
- 📈 Track learning progress over time
- 📂 View previously studied topics in a personal library

The application also includes secure user authentication using Clerk so each user's learning history remains private.

---

# ✨ Features

- 🔐 Secure authentication with Clerk
- 🤖 AI-generated study notes using Gemini AI
- 📝 AI-generated quizzes
- 🎯 Personalized practice quizzes based on weak areas
- 📊 AI-generated performance analysis
- 💬 AI Tutor chatbot
- 📚 Personal learning library
- 📈 Learning history and progress tracking
- 🗄️ PostgreSQL database hosted on Supabase
- 🎨 Responsive modern UI built with Next.js
- ⚡ FastAPI backend
- ☁️ Deployed on Vercel & Render

---

# 🛠 Tech Stack

## Frontend

- Next.js
- React
- JavaScript
- Tailwind CSS
- Clerk Authentication

## Backend

- FastAPI
- Python
- Google Gemini API
- Clerk Backend SDK

## Database

- PostgreSQL (Supabase)

## Deployment

- Vercel (Frontend)
- Render (Backend)

## AI

- Google Gemini API

  
# 📂 Project Structure

```
AI-StudyMate
│
├── backend
│   ├── main.py                    # FastAPI routes (all require a Clerk token)
│   ├── auth.py                    # Clerk token verification dependency
│   ├── database.py                # PostgreSQL access with a connection pool
│   ├── gemini_utils.py            # Shared Gemini client, retries, JSON parsing
│   ├── learning_service.py        # Summary + quiz generation (cached per topic)
│   ├── feedback_quiz_service.py   # Feedback + weak-area practice quiz
│   ├── progress_service.py        # Progress analysis after practice
│   ├── youtube_service.py         # Related video lookup (non-fatal on failure)
│   └── requirements.txt
│
├── frontend
│   ├── app                        # Next.js App Router pages
│   ├── lib/api.js                 # Authenticated fetch helper
│   ├── proxy.ts                   # Clerk middleware (protects /dashboard, /library)
│   └── ...
│
├── .gitignore
├── README.md
└── LICENSE
```

---

# ⚙️ Running Locally

## 1. Backend

```bash
cd backend
python -m venv venv
venv\Scriptsctivate        # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key (optional; videos are skipped without it) |
| `CLERK_SECRET_KEY` | Clerk secret key used to verify session tokens |
| `DATABASE_URL` | PostgreSQL connection string (Supabase) |
| `GEMINI_MODEL` | Optional primary model (default `models/gemini-flash-lite-latest`) |
| `GEMINI_FALLBACK_MODEL` | Optional fallback when the primary stalls (default `models/gemini-flash-latest`) |
| `GEMINI_TIMEOUT_MS` | Optional per-call timeout in milliseconds (default `30000`) |
| `AUTHORIZED_PARTIES` | Optional extra frontend origins, comma-separated |

Start the API:

```bash
uvicorn main:app --reload --port 8000
```

## 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key (server side) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/` |
| `NEXT_PUBLIC_API_URL` | Backend URL, e.g. `http://localhost:8000` |

Start the app:

```bash
npm run dev
```

Open http://localhost:3000.

## Security model

Every backend route except `/` requires a Clerk session token in the
`Authorization: Bearer` header. The user ID is taken from the verified token,
so study history is always scoped to the signed-in user and cannot be read or
written on behalf of someone else.

---

# 🚀 Future Improvements

- Flashcards
- Study streak tracking
- PDF upload and summarization
- Voice-based AI tutor
- Dark/Light mode
- Spaced repetition
- Multiple AI model support
- Export study notes as PDF

---

# 👨‍💻 Author

**Aadil Dar**

GitHub: https://github.com/Aadildar1

LinkedIn: https://linkedin.com/in/aadil-majeed-5733523a6

---

# 📄 License

This project is licensed under the MIT License.

---

## ⭐ If you found this project helpful, consider giving it a star!
