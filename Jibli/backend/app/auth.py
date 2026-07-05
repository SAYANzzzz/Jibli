from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from .supabase_client import get_supabase_admin

ADMIN_EMAIL = "sayanzzz2004@gmail.com"


def get_current_user(authorization: Annotated[str | None, Header()] = None) -> dict:
  if not authorization or not authorization.startswith("Bearer "):
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Missing authentication token.",
    )

  token = authorization.removeprefix("Bearer ").strip()
  response = get_supabase_admin().auth.get_user(token)

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

  if response.data:
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
        "role": "admin" if user.get("email", "").lower() == ADMIN_EMAIL else "user",
      }
    )
    .execute()
  )

  return created.data[0]


def require_admin(
  user: dict = Depends(get_current_user),
  profile: dict = Depends(get_current_profile),
) -> dict:
  if user.get("email", "").lower() != ADMIN_EMAIL:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="Admin access required.",
    )

  if profile.get("role") != "admin":
    get_supabase_admin().table("profiles").update({"role": "admin"}).eq("id", user["id"]).execute()
    profile["role"] = "admin"

  return profile
