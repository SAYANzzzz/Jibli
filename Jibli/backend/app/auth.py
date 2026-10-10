from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from gotrue.errors import AuthApiError, AuthRetryableError
from httpx import RequestError

from .supabase_client import get_supabase_admin

def get_current_user(authorization: Annotated[str | None, Header()] = None) -> dict:
  if not authorization or not authorization.startswith("Bearer "):
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Missing authentication token.",
    )

  token = authorization.removeprefix("Bearer ").strip()
  try:
    response = get_supabase_admin().auth.get_user(token)
  except (AuthRetryableError, RequestError) as error:
    raise HTTPException(status_code=503, detail="Cannot reach account verification. Please try again shortly.") from error
  except AuthApiError as error:
    if error.status >= 500:
      raise HTTPException(status_code=503, detail="Account verification is temporarily unavailable.") from error
    raise HTTPException(status_code=401, detail="Your session has expired. Please sign in again.") from error

  if not response.user:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Invalid authentication token.",
    )

  return {
    "id": response.user.id,
    "email": response.user.email,
    "metadata": response.user.user_metadata or {},
  }


def get_current_profile(user: dict = Depends(get_current_user)) -> dict:
  response = (
    get_supabase_admin()
    .table("profiles")
    .select("*")
    .eq("id", user["id"])
    .maybe_single()
    .execute()
  )

  if response and response.data:
    return response.data

  metadata = user.get("metadata", {})
  created = (
    get_supabase_admin()
    .table("profiles")
    .insert(
      {
        "id": user["id"],
        "full_name": metadata.get("full_name"),
        "phone": metadata.get("phone"),
        "role": "user",
      }
    )
    .execute()
  )

  return created.data[0]


def require_admin(
  user: dict = Depends(get_current_user),
  profile: dict = Depends(get_current_profile),
) -> dict:
  if profile.get("role") != "admin":
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="Admin access required.",
    )

  return profile
