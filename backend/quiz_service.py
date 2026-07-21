import os
import json

from dotenv import load_dotenv
from google import genai
from gemini_utils import safe_generate_content


load_dotenv()


client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def generate_quiz(topic):

    prompt = f"""
    You are an expert teacher.

    Create a multiple choice quiz about the following topic:

    Topic: {topic}

    Generate exactly 10 questions.

    Each question must have:
    - A question
    - Four options
    - The correct answer

    Return ONLY valid JSON.

    Do not use markdown.
    Do not use ```json.
    Do not add any explanation.

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
    "models/gemini-flash-latest",
    prompt
)

    quiz_text = response.text.strip()

    quiz = json.loads(quiz_text)

    return quiz