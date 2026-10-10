"""Browser -> real FastAPI invitation handlers -> in-memory DB -> guest page.

All accounts and orders are simulated; no external mutations or messages.
"""
import base64
import json
import os
import sys
import time
from pathlib import Path
from unittest.mock import patch
from urllib.parse import urlparse
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from test_payments import Database
from dotenv import dotenv_values
from fastapi import FastAPI
from fastapi.testclient import TestClient
from playwright.sync_api import sync_playwright, expect
from app.auth import get_current_profile, get_current_user
from app.invitations import router as invitation_router
from app.payments import router as payment_router

BASE = os.getenv("PLATFORM_BASE_URL", "http://127.0.0.1:5173")
root = Path(__file__).resolve().parents[2]
project = urlparse(os.getenv("VITE_SUPABASE_URL") or dotenv_values(root / ".env.local")["VITE_SUPABASE_URL"]).hostname.split(".")[0]
user = {"id": str(uuid4()), "email": "test@example.invalid", "aud": "authenticated", "role": "authenticated"}
encode = lambda value: base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip("=")
token = f"{encode({'alg': 'HS256', 'typ': 'JWT'})}.{encode({'sub': user['id'], 'exp': int(time.time()) + 3600, 'aud': 'authenticated'})}.test"
session = {"access_token": token, "refresh_token": "test-only", "token_type": "bearer", "expires_at": int(time.time()) + 3600, "expires_in": 3600, "user": user}
db = Database()
payment_id = str(uuid4())
db.rows["d17_orders"] = [{"id": payment_id, "user_id": user["id"], "product_key": "invitation:weddings:arabesque-burgundy", "title": "Wedding invitation", "kind": "invitation", "amount": 15, "phone": "92123456", "authorization": "001234", "review_note": "", "status": "confirmed", "delivery": "", "created_at": "2026-10-10T00:00:00Z", "details": json.dumps({"request": "Private order request", "invitation": {"title": "Wedding", "image": "/invitations/weddings/arabesque-burgundy.jfif", "mood": "garden", "certificate": False, "details": {"couple": "Amira & Youssef", "date": "2027-06-20", "time": "18:30", "venue": "Tunis", "language": "English", "note": ""}}})}]
app = FastAPI()
app.include_router(payment_router)
app.include_router(invitation_router)
app.dependency_overrides[get_current_user] = lambda: user
app.dependency_overrides[get_current_profile] = lambda: {"id": user["id"], "role": "admin"}
client = TestClient(app)

def handle(route):
    request = route.request
    path = urlparse(request.url).path
    if path == "/auth/v1/user": value = user
    elif "/rest/v1/profiles" in path: value = {"full_name": "Test Admin", "avatar_url": None}
    elif path == "/api/me/profile": value = {"id": user["id"], "role": "admin"}
    elif path == "/api/admin/orders": value = {"orders": []}
    else:
        response = client.request(request.method, path.removeprefix("/api"), json=request.post_data_json if request.method in {"POST", "PUT", "PATCH"} else None)
        route.fulfill(status=response.status_code, content_type="application/json", body=response.text)
        return
    route.fulfill(status=200, content_type="application/json", body=json.dumps(value))

with patch("app.payments.get_supabase_admin", return_value=db), patch("app.invitations.get_supabase_admin", return_value=db), sync_playwright() as p:
    browser = p.chromium.launch(channel=None if os.getenv("CI") else "msedge", headless=True)
    context = browser.new_context(viewport={"width": 390, "height": 844})
    context.add_init_script("localStorage.setItem(" + json.dumps("sb-" + project + "-auth-token") + "," + json.dumps(json.dumps(session)) + ");")
    for pattern in ["**/api/**", "**/auth/v1/**", "**/rest/v1/**"]: context.route(pattern, handle)
    page = context.new_page()
    page.goto(BASE + '/admin')
    page.get_by_text("Edit & publish guest invitation", exact=True).click()
    expect(page.get_by_label("Colour mood")).to_have_value("garden")
    expect(page.get_by_label("Final artwork URL (optional)")).to_have_value("")
    page.get_by_label("Public message", exact=True).fill("We cannot wait to celebrate with you")
    page.get_by_role("button", name="Save & publish", exact=True).click()
    link = page.get_by_role("link", name="Open delivery", exact=True)
    expect(link).to_be_visible()
    url = link.get_attribute("href")
    guest = context.new_page()
    guest.goto(BASE + url)
    guest.get_by_role("button", name="Open invitation:", exact=False).click()
    expect(guest.locator(".inviteWelcome h2")).to_have_text("Amira & Youssef")
    expect(guest.locator(".invitePersonalNote")).to_have_text("We cannot wait to celebrate with you")
    expect(guest.locator(".inviteMoodPicker")).to_have_count(0)
    assert "Private order request" not in guest.locator("body").inner_text()
    assert "92123456" not in guest.locator("body").inner_text()
    assert guest.evaluate("document.documentElement.scrollWidth <= innerWidth")
    page.get_by_role("button", name="Save & unpublish", exact=True).click()
    expect(page.get_by_role("button", name="Save & unpublish", exact=True)).to_be_enabled()
    guest.reload()
    expect(guest.get_by_role("alert")).to_contain_text("not available")
    browser.close()
print("Passed admin publish, saved mood, final artwork safety, guest privacy and unpublish through real API handlers.")
