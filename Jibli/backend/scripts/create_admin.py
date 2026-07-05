import getpass
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from dotenv import load_dotenv

from app.supabase_client import get_supabase_admin

load_dotenv(ROOT / ".env")


def require_env(name: str) -> str:
  value = os.getenv(name)

  if not value:
    raise RuntimeError(f"Missing {name}. Add it to backend/.env or set it in your terminal.")

  return value


def find_user_by_email(email: str):
  supabase = get_supabase_admin()
  page = 1

  while True:
    users = supabase.auth.admin.list_users(page=page, per_page=100)

    if not users:
      return None

    for user in users:
      if user.email and user.email.lower() == email.lower():
        return user

    if len(users) < 100:
      return None

    page += 1


def main() -> None:
  email = os.getenv("ADMIN_EMAIL", "sayanzzz2004@gmail.com")
  phone = os.getenv("ADMIN_PHONE", "92001397")
  password = os.getenv("ADMIN_PASSWORD") or getpass.getpass("Admin password: ")

  if len(password) < 6:
    raise RuntimeError("Admin password must be at least 6 characters.")

  supabase = get_supabase_admin()
  existing_user = find_user_by_email(email)
  user_metadata = {"full_name": "Admin", "phone": phone}

  if existing_user:
    user_response = supabase.auth.admin.update_user_by_id(
      existing_user.id,
      {
        "email": email,
        "password": password,
        "phone": phone,
        "email_confirm": True,
        "user_metadata": user_metadata,
      },
    )
    user_id = user_response.user.id
    print(f"Updated admin auth user: {email}")
  else:
    user_response = supabase.auth.admin.create_user(
      {
        "email": email,
        "password": password,
        "phone": phone,
        "email_confirm": True,
        "user_metadata": user_metadata,
      }
    )
    user_id = user_response.user.id
    print(f"Created admin auth user: {email}")

  supabase.table("profiles").upsert(
    {
      "id": user_id,
      "full_name": "Admin",
      "phone": phone,
      "role": "admin",
    },
    on_conflict="id",
  ).execute()

  print("Admin profile is ready.")


if __name__ == "__main__":
  require_env("SUPABASE_URL")
  require_env("SUPABASE_SERVICE_ROLE_KEY")
  main()
