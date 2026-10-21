from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from auth import get_current_user, CurrentUser, AUTHORIZED_PARTIES
from gemini_utils import safe_generate_content
from learning_service import generate_learning_content
from feedback_quiz_service import generate_feedback_and_weak_quiz
from progress_service import generate_progress_analysis
from database import (
    create_database,
    save_study_history,
    get_study_history,
)


app = FastAPI(title="AI StudyMate API")

create_database()


app.add_middleware(
    CORSMiddleware,
    allow_origins=AUTHORIZED_PARTIES,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TopicRequest(BaseModel):
    topic: str


class FeedbackRequest(BaseModel):
    topic: str
    score: int
    total: int
    mistakes: list


class ProgressRequest(BaseModel):
    topic: str
    original_score: int
    original_total: int
    practice_score: int
    practice_total: int
    original_mistakes: list
    practice_mistakes: list


class StudyHistoryRequest(BaseModel):
    topic: str
    original_score: int
    original_total: int
    practice_score: int
    practice_total: int
    progress_analysis: str


class ChatRequest(BaseModel):
    topic: str
    question: str


@app.get("/")
def home():
    return {"message": "AI StudyMate Backend is running"}


@app.get("/me")
def me(current_user: CurrentUser = Depends(get_current_user)):
    return {
        "message": "Authentication successful",
        "user": current_user.to_dict(),
    }


@app.post("/generate")
def generate_content(
    request: TopicRequest,
    current_user: CurrentUser = Depends(get_current_user),
):

    topic = request.topic.strip()

    if not topic:
        raise HTTPException(status_code=422, detail="Please enter a topic.")

    # Summary, quiz and videos come back together; the service runs the
    # Gemini and YouTube calls in parallel and caches the result per topic.
    learning_content = generate_learning_content(topic)

    return {
        "topic": topic,
        "summary": learning_content["summary"],
        "videos": learning_content["videos"],
        "quiz": learning_content["quiz"],
    }


@app.post("/feedback")
def get_feedback(
    request: FeedbackRequest,
    current_user: CurrentUser = Depends(get_current_user),
):

    content = generate_feedback_and_weak_quiz(
        request.topic,
        request.score,
        request.total,
        request.mistakes,
    )

    return {
        "feedback": content.get("feedback", ""),
        "weak_quiz": content.get("weak_quiz", []),
    }


@app.post("/progress-analysis")
def get_progress_analysis(
    request: ProgressRequest,
    current_user: CurrentUser = Depends(get_current_user),
):

    analysis = generate_progress_analysis(
        request.topic,
        request.original_score,
        request.original_total,
        request.practice_score,
        request.practice_total,
        request.original_mistakes,
        request.practice_mistakes,
    )

    return {"analysis": analysis}


@app.post("/save-history")
def save_history(
    request: StudyHistoryRequest,
    current_user: CurrentUser = Depends(get_current_user),
):

    # The user id comes from the verified token, never from the client.
    save_study_history(
        current_user.id,
        request.topic,
        request.original_score,
        request.original_total,
        request.practice_score,
        request.practice_total,
        request.progress_analysis,
    )

    return {"message": "Study history saved successfully"}


@app.get("/history")
def get_history(current_user: CurrentUser = Depends(get_current_user)):

    history = get_study_history(current_user.id)

    return {"history": history}


@app.get("/library")
def learning_library(current_user: CurrentUser = Depends(get_current_user)):

    # The library is the signed-in user's own study history.
    return {"topics": get_study_history(current_user.id)}


@app.post("/chat")
def chat_with_ai(
    request: ChatRequest,
    current_user: CurrentUser = Depends(get_current_user),
):

    prompt = f"""
    You are an expert teacher.

    The student is studying:

    {request.topic}

    The student asked:

    {request.question}

    Your job:

    - Answer clearly.
    - Use simple English.
    - Explain like a teacher.
    - Give examples whenever possible.
    - If appropriate, use analogies.
    - Keep the answer under 300 words.
    """

    response = safe_generate_content(prompt)

    return {"answer": response.text}
