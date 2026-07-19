import os
from database import get_learning_library
from fastapi import Depends
from auth import get_current_user
from fastapi import FastAPI, Query

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from youtube_service import search_youtube_videos
from learning_service import generate_learning_content
from feedback_quiz_service import generate_feedback_and_weak_quiz
from progress_service import generate_progress_analysis
from database import (
    create_database,
    save_study_history,
    get_study_history
)

load_dotenv()


app = FastAPI()

create_database()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3000",
    "https://ai-study-mate-xi.vercel.app",
],
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
    user_id: str
    topic: str
    original_score: int
    original_total: int
    practice_score: int
    practice_total: int
    progress_analysis: str

class ChatRequest(BaseModel):
    topic: str
    question: str

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


@app.get("/")
def home():
    return {
        "message": "AI StudyMate Backend is running"
    }


@app.post("/generate")
def generate_content(request: TopicRequest):

    learning_content = generate_learning_content(
        request.topic
    )

    videos = search_youtube_videos(
        request.topic
    )

    return {
        "topic": request.topic,
        "summary": learning_content["summary"],
        "videos": videos,
        "quiz": learning_content["quiz"]
    }
@app.post("/feedback")
def get_feedback(request: FeedbackRequest):

    content = generate_feedback_and_weak_quiz(
        request.topic,
        request.score,
        request.total,
        request.mistakes
    )

    return {
        "feedback": content["feedback"],
        "weak_quiz": content["weak_quiz"]
    }

@app.post("/progress-analysis")
def get_progress_analysis(request: ProgressRequest):

    analysis = generate_progress_analysis(
        request.topic,
        request.original_score,
        request.original_total,
        request.practice_score,
        request.practice_total,
        request.original_mistakes,
        request.practice_mistakes
    )

    return {
        "analysis": analysis
    }
@app.post("/save-history")
def save_history(request: StudyHistoryRequest):

    save_study_history(
        request.user_id,

        request.topic,

        request.original_score,

        request.original_total,

        request.practice_score,

        request.practice_total,

        request.progress_analysis
)

    return {
        "message": "Study history saved successfully"
    }
@app.get("/history")
def get_history(user_id: str = Query(...)):

    history = get_study_history(user_id)

    return {
        "history": history
    }
@app.get("/me")
def me(current_user = Depends(get_current_user)):

    return {
        "message": "Authentication successful",
        "user": current_user.to_dict()
    }
@app.post("/chat")
def chat_with_ai(request: ChatRequest):

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

    response = client.models.generate_content(
    model="gemini-3-flash-preview",
    contents=prompt
)
    

    return {
        "answer": response.text
    }
@app.get("/library")
def learning_library():

    library = get_learning_library()

    return {
        "topics": library
    }