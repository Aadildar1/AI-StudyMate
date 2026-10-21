import os
import json
import time

import httpx

from dotenv import load_dotenv
from fastapi import HTTPException
from google import genai
from google.genai.errors import ClientError, ServerError


load_dotenv()

# Primary model and a fallback used when the primary is overloaded or
# stalls. Both can be overridden from the environment without a deploy.
MODEL = os.getenv("GEMINI_MODEL", "models/gemini-flash-lite-latest")
FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL", "models/gemini-3.5-flash-lite")

# Hard cap per Gemini call so a stalled request fails fast instead of
# leaving the student staring at a spinner indefinitely.
REQUEST_TIMEOUT_MS = int(os.getenv("GEMINI_TIMEOUT_MS", "30000"))

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY"),
    http_options={"timeout": REQUEST_TIMEOUT_MS},
)


def _models_to_try():
    models = [MODEL]
    if FALLBACK_MODEL and FALLBACK_MODEL != MODEL:
        models.append(FALLBACK_MODEL)
    return models


def safe_generate_content(prompt, json_output=False):
    """Call Gemini, retrying once per model and falling back to a second model.

    Transient failures (5xx, deadline exceeded, HTTP timeout) move on to the
    next attempt; quota errors and bad requests are reported immediately.
    When json_output is True, Gemini is asked to return strict JSON.
    """

    config = {"response_mime_type": "application/json"} if json_output else None

    last_error = None

    for model in _models_to_try():

        for attempt in (1, 2):

            try:
                started = time.perf_counter()

                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=config,
                )

                print(f"Gemini {model} answered in {time.perf_counter() - started:.1f}s")
                return response

            except (ServerError, httpx.TimeoutException) as error:
                last_error = error
                print(f"Gemini {model} unavailable ({type(error).__name__}), attempt {attempt}/2")
                if attempt == 1:
                    time.sleep(1)

            except ClientError as error:

                if error.code == 429:
                    raise HTTPException(
                        status_code=429,
                        detail="AI StudyMate has reached its Gemini API quota. Please try again later."
                    )

                if error.code == 404:
                    # Model alias retired: skip straight to the fallback.
                    last_error = error
                    print(f"Gemini model {model} not found, trying fallback")
                    break

                raise HTTPException(status_code=500, detail=str(error))

    print(f"All Gemini attempts failed: {last_error}")

    raise HTTPException(
        status_code=503,
        detail="Gemini AI is currently busy. Please try again in a few moments."
    )


def parse_json_response(response):
    """Parse Gemini's reply as JSON, tolerating markdown code fences."""

    text = (response.text or "").strip()

    if text.startswith("```"):
        text = text.strip("`").strip()
        if text.lower().startswith("json"):
            text = text[4:].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        print("Invalid JSON returned by Gemini:")
        print(text)
        raise HTTPException(
            status_code=502,
            detail="The AI returned an unexpected response. Please try again."
        )
