import os
import json

from dotenv import load_dotenv
from google import genai
from gemini_utils import safe_generate_content
from database import (
    get_cached_learning_content,
    save_learning_content_cache
)


load_dotenv()


client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def generate_learning_content(topic):

    cached_content = get_cached_learning_content(topic)

    if cached_content is not None:
        print(
            f"CACHE HIT: Learning content found for '{topic}'"
        )

        return cached_content

    print(
        f"CACHE MISS: Generating AI content for '{topic}'"
    )

    prompt = f"""
    You are an expert teacher.

    A student wants to learn the following topic:

    Topic: {topic}

    Complete TWO tasks.

    TASK 1: SUMMARY

    Generate a clear and simple educational summary.

    Summary requirements:
    - Use simple student-friendly language
    - Explain the main concept
    - Include important points
    - Keep the summary under 250 words
    - You may use Markdown formatting

    TASK 2: QUIZ

    Generate exactly 10 multiple choice questions about the topic.

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
        "summary": "Educational summary here",
        "quiz": [
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

    learning_content = json.loads(content_text)

    save_learning_content_cache(
        topic,
        learning_content["summary"],
        learning_content["quiz"]
    )

    print(
        f"CACHE SAVED: Learning content stored for '{topic}'"
    )

    return learning_content