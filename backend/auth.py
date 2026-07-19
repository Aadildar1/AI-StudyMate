import os

from dotenv import load_dotenv

from fastapi import HTTPException, Request, status

from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions

load_dotenv()

clerk = Clerk(
    bearer_auth=os.getenv("CLERK_SECRET_KEY")
)

PUBLISHABLE_KEY = os.getenv("CLERK_PUBLISHABLE_KEY")


def get_current_user(request: Request):

    state = clerk.authenticate_request(
        request,
        AuthenticateRequestOptions(
    authorized_parties=[
        "http://localhost:3000",
        "https://ai-study-mate-xi.vercel.app"
    ]
)
    )

    if not state.is_signed_in:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized"
        )

    return state