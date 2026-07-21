import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

url = os.environ["SUPABASE_URL"]
key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
sb = create_client(url, key)

email = sys.argv[1]

page = 1
found = None
while True:
    result = sb.auth.admin.list_users(page=page, per_page=200)
    users = result if isinstance(result, list) else getattr(result, "users", result)
    if not users:
        break
    for u in users:
        if (u.email or "").lower() == email.lower():
            found = u
            break
    if found or len(users) < 200:
        break
    page += 1

if not found:
    print("No auth.users record found for", email)
else:
    print("id:", found.id)
    print("email:", found.email)
    print("email_confirmed_at:", found.email_confirmed_at)
    print("confirmation_sent_at:", found.confirmation_sent_at)
    print("created_at:", found.created_at)
    print("last_sign_in_at:", found.last_sign_in_at)

    profile = sb.table("profiles").select("*").eq("id", found.id).maybe_single().execute()
    print("profile row:", profile.data)
