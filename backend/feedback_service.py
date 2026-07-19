import os

from dotenv import load_dotenv
from google import genai
from gemini_utils import safe_generate_content


load_dotenv()


client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def generate_feedback(topic, score, total, mistakes):

    prompt = f"""
    You are an expert teacher and learning mentor.

    A student completed a quiz.

    Topic: {topic}

    Score: {score}/{total}

    Student mistakes:

    {mistakes}

    Analyze the student's quiz performance.

    Give personalized feedback.

    Requirements:

    - Start with a short performance assessment
    - Explain what the student understands well
    - Identify the concepts the student needs to improve
    - Explain why those concepts are important
    - Give clear suggestions on what to revise
    - Give a short study recommendation
    - Use simple student-friendly language
    - Use Markdown headings and bullet points
    - Do not make the student feel discouraged
    - Keep the feedback under 300 words
    """

    response = safe_generate_content(
    client,
    "gemini-3-flash-preview",
    prompt
)

    return response.text