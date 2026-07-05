import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.supabase_client import get_supabase_admin


REQUIRED_TABLES = ["profiles", "carts", "cart_items", "orders", "order_events"]


def main() -> None:
  supabase = get_supabase_admin()

  for table in REQUIRED_TABLES:
    supabase.table(table).select("*").limit(1).execute()
    print(f"{table}: ok")


if __name__ == "__main__":
  main()
