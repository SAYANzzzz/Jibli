"""Local browser regression with simulated auth/API; never transfers money or sends messages."""
import os
import base64
import json
import time
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from uuid import uuid4

from dotenv import dotenv_values
from playwright.sync_api import sync_playwright, expect

BASE = os.getenv("PLATFORM_BASE_URL", "http://127.0.0.1:5173")
root = Path(__file__).resolve().parents[2]
project = urlparse((os.getenv("VITE_SUPABASE_URL") or dotenv_values(root / ".env.local")["VITE_SUPABASE_URL"])).hostname.split(".")[0]
user = {"id": str(uuid4()), "email": "test@example.invalid", "aud": "authenticated", "role": "authenticated"}
encode = lambda value: base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip("=")
token = f"{encode({'alg': 'HS256', 'typ': 'JWT'})}.{encode({'sub': user['id'], 'exp': int(time.time()) + 3600, 'aud': 'authenticated'})}.test"
session = {"access_token": token, "refresh_token": "test-only", "token_type": "bearer", "expires_at": int(time.time()) + 3600, "expires_in": 3600, "user": user}
payments = []


def handle(route):
    request = route.request
    path = urlparse(request.url).path
    body = request.post_data_json if request.method in ("POST", "PATCH") else {}
    result = {}
    if path == "/auth/v1/user": result = user
    elif "/rest/v1/profiles" in path: result = {"full_name": "Test Customer", "avatar_url": None}
    elif path == "/api/me/profile": result = {"id": user["id"], "role": "admin"}
    elif path == "/api/admin/orders": result = {"orders": []}
    elif path in ("/api/payments", "/api/admin/payments"): result = {"payments": payments}
    elif path == "/api/payments/checkout":
        payments.append({**body, "title": "Arabesque burgundy / weddings", "amount": 15, "kind": "invitation", "authorization": None, "status": "pending_payment", "delivery": "", "review_note": "", "created_at": "2026-10-10T00:00:00Z"})
        result = {"payment": payments[0]}
    elif path.endswith("/reference"):
        payments[0].update(authorization=body["authorization"], status="pending_verification")
        result = {"payment": payments[0]}
    elif path.startswith("/api/admin/payments/"):
        payments[0].update(status=body["status"], review_note=body["note"], delivery=body["delivery"])
        result = {"payment": payments[0]}
    route.fulfill(status=200, content_type="application/json", body=json.dumps(result))


with sync_playwright() as p:
    browser = p.chromium.launch(channel=None if os.getenv("CI") else "msedge", headless=True)
    context = browser.new_context(viewport={"width": 390, "height": 844})
    context.add_init_script("localStorage.setItem(" + json.dumps("sb-" + project + "-auth-token") + "," + json.dumps(json.dumps(session)) + ");")
    context.route("**/api/**", handle)
    context.route("**/auth/v1/**", handle)
    context.route("**/rest/v1/**", handle)
    page = context.new_page()
    page.goto(BASE + '/invitations/weddings')
    page.locator(".weddingDesignCard").first.click()
    page.get_by_label("Couple's names").fill("Amira & Youssef")
    page.get_by_role("button", name="Continue to D17 payment").click()
    page.get_by_label("Your WhatsApp number").fill("92123456")
    page.get_by_role("button", name="Show payment details").click()
    expect(page.locator(".d17Amount")).to_contain_text("15")
    expect(page.locator(".d17Steps")).to_contain_text("92001397")
    page.get_by_label("Numéro d’autorisation", exact=True).fill("000123")
    page.get_by_label("Confirm the authorization number").fill("000124")
    page.get_by_role("button", name="Submit for verification").click()
    expect(page.get_by_role("alert")).to_contain_text("do not match")
    page.get_by_label("Confirm the authorization number").fill("000123")
    page.get_by_role("button", name="Submit for verification").click()
    link = page.get_by_role("link", name="Send on WhatsApp")
    expect(link).to_be_visible()
    assert "000123" in parse_qs(urlparse(link.get_attribute("href")).query)["text"][0]
    assert payments[0]["status"] == "pending_verification"
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    page.goto(BASE + '/admin')
    page.get_by_role("button", name="I checked D17 — confirm payment").click()
    expect(page.get_by_role("article").get_by_text("Payment verified — order confirmed", exact=True)).to_be_visible()
    page.get_by_role("button", name="Start processing").click()
    page.get_by_label("Gift card code, invitation / subscription link, or AliExpress tracking").fill("Your invitation: https://example.invalid/invitation")
    page.get_by_role("button", name="Save delivery & complete order").click()
    expect(page.get_by_role("link", name="Send customer update on WhatsApp")).to_be_visible()
    page.goto(BASE + '/payment?id=' + payments[0]["id"])
    expect(page.locator(".d17Delivery")).to_contain_text("https://example.invalid/invitation")
    browser.close()
    print("Browser smoke passed: checkout, mismatch, leading zeros, WhatsApp link, admin verification, processing and customer delivery.")
