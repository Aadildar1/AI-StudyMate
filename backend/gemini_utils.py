from google.genai.errors import ClientError


from google.genai.errors import ClientError
from fastapi import HTTPException


def safe_generate_content(client, model, prompt):

    try:
        response = client.models.generate_content(
            model=model,
            contents=prompt
        )

        return response

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