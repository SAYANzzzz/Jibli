import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


class Settings:
  supabase_url: str
  supabase_service_role_key: str
  frontend_origin: str

  def __init__(self) -> None:
    self.supabase_url = os.getenv("SUPABASE_URL", "")
    self.supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    self.frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5174")

    if not self.supabase_url or not self.supabase_service_role_key:
      raise RuntimeError(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend environment."
      )


@lru_cache
def get_settings() -> Settings:
  return Settings()
