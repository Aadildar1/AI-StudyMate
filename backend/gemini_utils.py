import os
import json
import time
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED

import httpx

from dotenv import load_dotenv
from fastapi import HTTPException
from google import genai
from google.genai.errors import ClientError, ServerError


load_dotenv()

# Primary model and a fallback. Both can be overridden from the environment
# without a deploy.
MODEL = os.getenv("GEMINI_MODEL", "models/gemini-flash-lite-latest")
FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL", "models/gemini-3.5-flash-lite")

# Hard cap per Gemini call so a stalled request fails fast instead of
# leaving the student staring at a spinner indefinitely.
REQUEST_TIMEOUT_MS = int(os.getenv("GEMINI_TIMEOUT_MS", "30000"))

# Gemini's latency is spiky: the same prompt answers in 3s one moment and
# 20s+ or a 504 the next. If the primary model has not answered within this
# many seconds, a second request is sent to the fallback model and whichever
# answers first wins ("hedged request"). The loser is simply discarded.
HEDGE_AFTER_S = float(os.getenv("GEMINI_HEDGE_AFTER_S", "5"))

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY"),
    http_options={"timeout": REQUEST_TIMEOUT_MS},
)


def _models_to_try():
    models = [MODEL]
    if FALLBACK_MODEL and FALLBACK_MODEL != MODEL:
        models.append(FALLBACK_MODEL)
    return models


def _call(model, prompt, config):
    return client.models.generate_content(
        model=model,
        contents=prompt,
        config=config,
    )


def safe_generate_content(prompt, json_output=False):
    """Call Gemini with a hedged fallback and clear HTTP errors.

    - The primary model is called first.
    - If it has not answered after HEDGE_AFTER_S seconds, or it fails with a
      transient error, the fallback model is called too.
    - The first successful answer is returned; quota and bad-request errors
      are reported immediately; if every attempt fails, a 503 is raised.

    When json_output is True, Gemini is asked to return strict JSON.
    """

    config = {"response_mime_type": "application/json"} if json_output else None

    models = _models_to_try()
    started = time.perf_counter()
    executor = ThreadPoolExecutor(max_workers=len(models))
    pending = {}          # future -> model name
    failures = []         # (model, error) for the log line
    hedged = len(models) == 1

    try:
        pending[executor.submit(_call, models[0], prompt, config)] = models[0]

        while pending:
            timeout = None
            if not hedged:
                timeout = max(0.0, HEDGE_AFTER_S - (time.perf_counter() - started))

            done, _ = wait(list(pending), timeout=timeout, return_when=FIRST_COMPLETED)

            for future in done:
                model = pending.pop(future)

                try:
                    response = future.result()
                    elapsed = time.perf_counter() - started
                    print(f"Gemini {model} answered in {elapsed:.1f}s"
                          + (" (hedged)" if hedged and model != models[0] else ""))
                    return response

                except ClientError as error:
                    if error.code == 429:
                        raise HTTPException(
                            status_code=429,
                            detail="AI StudyMate has reached its Gemini API quota. Please try again later."
                        )
                    if error.code == 404:
                        failures.append((model, "model not found"))
                        continue
                    raise HTTPException(status_code=500, detail=str(error))

                except (ServerError, httpx.TimeoutException) as error:
                    failures.append((model, type(error).__name__))

            # Start the fallback once: when the hedge timer fires, or as soon
            # as the primary has failed.
            if not hedged:
                hedged = True
                reason = "slow" if not failures else failures[-1][1]
                print(f"Gemini {models[0]} {reason}; hedging with {models[1]}")
                pending[executor.submit(_call, models[1], prompt, config)] = models[1]

    finally:
        executor.shutdown(wait=False, cancel_futures=True)

    print(f"All Gemini attempts failed after {time.perf_counter() - started:.1f}s: {failures}")

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
