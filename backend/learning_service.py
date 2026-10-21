from concurrent.futures import ThreadPoolExecutor

from fastapi import HTTPException

from gemini_utils import safe_generate_content, parse_json_response
from youtube_service import search_youtube_videos
from database import (
    get_cached_learning_content,
    save_learning_content_cache
)


QUIZ_SIZE = 10


def _clean_quiz(quiz):
    """Keep only well-formed questions whose answer is one of its options.

    Gemini occasionally returns an answer with different punctuation or
    casing than the option text; those are repaired by matching loosely.
    """

    if not isinstance(quiz, list):
        return []

    cleaned = []

    for item in quiz:
        if not isinstance(item, dict):
            continue

        question = str(item.get("question", "")).strip()
        options = [str(o).strip() for o in item.get("options", []) if str(o).strip()]
        answer = str(item.get("answer", "")).strip()

        if not question or len(options) != 4 or len(set(options)) != 4:
            continue

        if answer not in options:
            # Try a forgiving match (case/punctuation) before giving up.
            key = answer.lower().rstrip(".")
            matches = [o for o in options if o.lower().rstrip(".") == key]
            if len(matches) != 1:
                continue
            answer = matches[0]

        cleaned.append({
            "question": question,
            "options": options,
            "answer": answer,
        })

    return cleaned[:QUIZ_SIZE]


def _generate_with_gemini(topic):

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

    Generate exactly {QUIZ_SIZE} multiple choice questions about the topic.

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

    response = safe_generate_content(prompt, json_output=True)

    content = parse_json_response(response)

    summary = str(content.get("summary", "")).strip() if isinstance(content, dict) else ""
    quiz = _clean_quiz(content.get("quiz") if isinstance(content, dict) else None)

    if not summary or len(quiz) < 5:
        print(f"Gemini returned unusable content: summary={bool(summary)} questions={len(quiz)}")
        raise HTTPException(
            status_code=502,
            detail="The AI could not build a complete lesson for this topic. Please try again."
        )

    return summary, quiz


def generate_learning_content(topic):
    """Return {summary, quiz, videos} for a topic, using the cache when possible.

    On a cache miss the Gemini call and the YouTube lookup run at the same
    time, so the student waits for the slower of the two instead of both.
    """

    cached = get_cached_learning_content(topic)

    if cached is not None:
        print(f"CACHE HIT: Learning content found for '{topic}'")

        if cached["videos"] is None:
            # Lesson cached before videos were stored: fetch once and keep.
            cached["videos"] = search_youtube_videos(topic)
            save_learning_content_cache(
                topic, cached["summary"], cached["quiz"], cached["videos"]
            )

        return cached

    print(f"CACHE MISS: Generating AI content for '{topic}'")

    with ThreadPoolExecutor(max_workers=2) as executor:
        gemini_future = executor.submit(_generate_with_gemini, topic)
        videos_future = executor.submit(search_youtube_videos, topic)

        summary, quiz = gemini_future.result()
        videos = videos_future.result()

    save_learning_content_cache(topic, summary, quiz, videos)

    print(f"CACHE SAVED: Learning content stored for '{topic}'")

    return {
        "summary": summary,
        "quiz": quiz,
        "videos": videos,
    }
