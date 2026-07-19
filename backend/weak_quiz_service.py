import os
import json

from dotenv import load_dotenv
from google import genai
from gemini_utils import safe_generate_content


load_dotenv()


client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def generate_weak_area_quiz(topic, mistakes):

    prompt = f"""
    You are an expert teacher.

    A student completed a quiz about:

    Topic: {topic}

    The student made the following mistakes:

    {mistakes}

    Analyze these mistakes and create a focused practice quiz.

    Generate exactly 5 multiple choice questions.

    The questions must focus specifically on the concepts
    the student misunderstood in the previous quiz.

    Do not simply repeat the previous questions.

    Create new questions that test the same weak concepts
    from a different angle.

    Each question must have:
    - A question
    - Exactly four options
    - The correct answer

    Return ONLY valid JSON.

    Do not use markdown.
    Do not use ```json.
    Do not add explanations before or after the JSON.

    Use exactly this format:

    [
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
    """

    response = safe_generate_content(
    client,
    "gemini-3-flash-preview",
    prompt
)

    quiz_text = response.text.strip()

    quiz = json.loads(quiz_text)

    return quiz