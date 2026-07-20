import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


class Settings:
  supabase_url: str
  supabase_service_role_key: str
  frontend_origins: list[str]

  def __init__(self) -> None:
    self.supabase_url = os.getenv("SUPABASE_URL", "")
    self.supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Accepts one or more comma-separated origins, e.g.
    # "https://jibli.vercel.app,https://www.jibli.tn"
    raw_origins = os.getenv("FRONTEND_ORIGIN", "http://localhost:5174")
    self.frontend_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

    if not self.supabase_url or not self.supabase_service_role_key:
      raise RuntimeError(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend environment."
      )


@lru_cache
def get_settings() -> Settings:
  return Settings()
