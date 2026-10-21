import os

from dotenv import load_dotenv
from fastapi import HTTPException, Request, status

from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions

load_dotenv()

clerk = Clerk(
    bearer_auth=os.getenv("CLERK_SECRET_KEY")
)

# Origins that may present a Clerk session token to this API.
# Extra origins can be added with a comma-separated AUTHORIZED_PARTIES env var.
AUTHORIZED_PARTIES = [
    "http://localhost:3000",
    "https://ai-study-mate-xi.vercel.app",
] + [
    origin.strip()
    for origin in os.getenv("AUTHORIZED_PARTIES", "").split(",")
    if origin.strip()
]


class CurrentUser:
    """The verified identity behind a request."""

    def __init__(self, payload):
        self.id = payload.get("sub")
        self.payload = payload

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.payload.get("sid"),
        }


def get_current_user(request: Request) -> CurrentUser:
    """FastAPI dependency: verify the Clerk bearer token or reject with 401."""

    state = clerk.authenticate_request(
        request,
        AuthenticateRequestOptions(
            authorized_parties=AUTHORIZED_PARTIES
        )
    )

    if not state.is_signed_in or not state.payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please sign in to use AI StudyMate."
        )

    return CurrentUser(state.payload)
