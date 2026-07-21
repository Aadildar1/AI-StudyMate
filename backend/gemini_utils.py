from fastapi import HTTPException
from google.genai.errors import ClientError, ServerError
import time


def safe_generate_content(client, model, prompt):

    # Retry temporary server errors
    for attempt in range(3):

        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt
            )

            return response

        except ServerError:

            if attempt < 2:
                print(f"Gemini busy. Retrying... ({attempt + 1}/3)")
                time.sleep(2)
                continue

            raise HTTPException(
                status_code=503,
                detail="Gemini AI is currently busy. Please try again in a few moments."
            )

        except ClientError as error:

            if error.code == 429:
                raise HTTPException(
                    status_code=429,
                    detail="AI StudyMate has reached its Gemini API quota. Please try again later."
                )

            raise HTTPException(
                status_code=500,
                detail=str(error)
            )