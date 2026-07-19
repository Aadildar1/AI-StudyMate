import os
import json

from dotenv import load_dotenv
from google import genai
from gemini_utils import safe_generate_content


load_dotenv()


client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def generate_feedback_and_weak_quiz(
    topic,
    score,
    total,
    mistakes
):

    prompt = f"""
    You are an expert teacher and adaptive learning mentor.

    A student completed a quiz.

    Topic: {topic}

    Score: {score}/{total}

    Student mistakes:

    {mistakes}

    Complete TWO tasks.


    TASK 1: PERFORMANCE FEEDBACK

    Analyze the student's performance.

    The feedback must:

    - Start with a short performance assessment
    - Explain what the student understands well
    - Identify concepts the student needs to improve
    - Explain the student's main misconceptions
    - Give clear suggestions about what to revise
    - Give a short study recommendation
    - Use simple student-friendly language
    - Use Markdown formatting
    - Keep the feedback under 300 words


    TASK 2: WEAK AREA PRACTICE QUIZ

    Create exactly 5 multiple choice questions.

    The questions must focus specifically on concepts
    the student misunderstood.

    Do not simply repeat the original questions.

    Test the same weak concepts from a different angle.

    Each question must contain:

    - A question
    - Exactly four options
    - The correct answer

    The correct answer must exactly match one of the four options.


    Return ONLY valid JSON.

    Do not use ```json.
    Do not add text before or after the JSON.

    Use exactly this JSON structure:

    {{
        "feedback": "Performance feedback using Markdown",
        "weak_quiz": [
            {{
                "question": "Question text",
                "options": [
                    "Option A",
                    "Option B",
                    "Option C",
                    "Option D"
                ],
                "answer": "Correct option text"
            }}
        ]
    }}
    """

    response = safe_generate_content(
        client,
        "gemini-3-flash-preview",
        prompt
    )

    content_text = response.text.strip()

    content = json.loads(content_text)

    return content