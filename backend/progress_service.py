import os

from dotenv import load_dotenv
from google import genai
from gemini_utils import safe_generate_content


load_dotenv()


client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def generate_progress_analysis(
    topic,
    original_score,
    original_total,
    practice_score,
    practice_total,
    original_mistakes,
    practice_mistakes
):

    prompt = f"""
    You are an expert teacher and learning progress analyst.

    A student is studying the following topic:

    Topic: {topic}

    ORIGINAL QUIZ PERFORMANCE

    Score: {original_score}/{original_total}

    Original mistakes:

    {original_mistakes}


    FOCUSED PRACTICE PERFORMANCE

    Score: {practice_score}/{practice_total}

    Practice mistakes:

    {practice_mistakes}


    Analyze whether the student's understanding improved after
    focused practice.

    Requirements:

    - Start with a clear learning progress assessment
    - Explain what concepts the student improved in
    - Identify concepts the student still struggles with
    - Compare the original quiz and focused practice performance
    - Give specific topics the student should revise next
    - Give a short next-step study recommendation
    - Use simple student-friendly language
    - Use Markdown headings and bullet points
    - Keep the analysis under 300 words
    """

    response = safe_generate_content(
    client,
    "models/gemini-flash-latest",
    prompt
)
    return response.text