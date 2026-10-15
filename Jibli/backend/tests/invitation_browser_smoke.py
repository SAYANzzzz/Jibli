"""Browser -> real FastAPI invitation handlers -> in-memory DB -> guest page.

All accounts and orders are simulated; no external mutations or messages.
"""
import base64
import json
import os
import re
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
    engine = os.getenv("INVITATION_BROWSER", "chromium")
    browser = getattr(p, engine).launch(**({"channel": "msedge"} if engine == "chromium" and not os.getenv("CI") else {}), headless=True)
    context = browser.new_context(viewport={"width": 390, "height": 844})
    context.add_init_script("localStorage.setItem(" + json.dumps("sb-" + project + "-auth-token") + "," + json.dumps(json.dumps(session)) + ");")
    for pattern in ["**/api/**", "**/auth/v1/**", "**/rest/v1/**"]: context.route(pattern, handle)
    page = context.new_page()
    page.add_init_script('Object.defineProperty(navigator, "clipboard", {value: {writeText: async text => {window.testCopiedText = text;}}});')
    page.goto(BASE + '/admin')
    page.get_by_text("Edit & publish guest invitation", exact=True).click()
    expect(page.get_by_label("Colour mood")).to_have_value("garden")
    expect(page.get_by_label("Final artwork URL (optional)")).to_have_value("")
    checkbox = page.get_by_label("Achievement certificate")
    assert checkbox.bounding_box()["width"] <= 24
    page.get_by_label("Public message", exact=True).fill("We cannot wait to celebrate with you")
    page.get_by_role("button", name="Save & publish", exact=True).click()
    link = page.get_by_role("link", name="Preview invitation", exact=True)
    expect(link).to_be_visible()
    url = link.get_attribute("href")
    share = page.locator('.invitationShareCard')
    expect(share.get_by_label('Guest invitation link')).to_have_value(url)
    expect(share.get_by_label('Ready-to-send message')).to_have_value(re.compile('Your personalised invitation is ready!'))
    whatsapp = share.get_by_role('link', name='Open WhatsApp message').get_attribute('href')
    assert whatsapp.startswith('https://wa.me/21692123456?text=')
    from urllib.parse import parse_qs
    message = parse_qs(urlparse(whatsapp).query)['text'][0]
    assert url in message and 'Amira & Youssef' in message
    assert 'Private order request' not in message and '001234' not in message
    share.get_by_role('button', name='Copy invitation link', exact=True).click()
    expect(share.get_by_role('status')).to_have_text('Copied')
    assert page.evaluate('window.testCopiedText') == url
    share.get_by_role('button', name='Share with guests', exact=True).click()
    assert share.get_by_role('link', name='Open WhatsApp message').get_attribute('href').startswith('https://wa.me/?text=')
    expect(share.get_by_label('Ready-to-send message')).to_have_value(re.compile('You are warmly invited!'))
    guest = context.new_page()
    guest.goto(url)
    guest.get_by_role("button", name="Open invitation:", exact=False).click()
    expect(guest.locator(".inviteEnvelope")).to_have_count(0)
    expect(guest.locator(".invitePersonalisedCover h2")).to_have_text("Amira & Youssef")
    icon = guest.locator(".invitePersonalisedCover > svg")
    assert abs(icon.bounding_box()["width"] - 24) < .1, icon.bounding_box()
    assert abs(icon.bounding_box()["height"] - 24) < .1, icon.bounding_box()
    assert guest.locator(".animatedInvite").evaluate("el => getComputedStyle(el).getPropertyValue('--paper').trim()") == "#f0f3e9"
    expect(guest.locator(".invitePersonalNote")).to_have_text("We cannot wait to celebrate with you")
    expect(guest.locator(".inviteMoodPicker")).to_have_count(0)
    assert "Private order request" not in guest.locator("body").inner_text()
    assert "92123456" not in guest.locator("body").inner_text()
    assert guest.evaluate("document.documentElement.scrollWidth <= innerWidth")
    for width in [320, 390, 1440]:
        guest.set_viewport_size({"width": width, "height": 844})
        assert abs(icon.bounding_box()["width"] - 24) < .1, icon.bounding_box()
        assert abs(icon.bounding_box()["height"] - 24) < .1, icon.bounding_box()
        assert guest.evaluate("document.documentElement.scrollWidth <= innerWidth")
        guest.locator('.inviteExpandButton').click()
        expect(guest.get_by_role('dialog')).to_be_visible()
        reveal = guest.locator('.inviteReveal')
        reveal.evaluate('(el) => el.scrollTop = el.scrollHeight')
        assert reveal.evaluate('(el) => el.scrollTop > 0')
        guest.keyboard.press('Escape')
        expect(guest.get_by_role('dialog')).to_have_count(0)
    page.get_by_role('textbox', name='Language', exact=True).fill('French')
    page.get_by_role('button', name='Save & publish', exact=True).click()
    expect(page.get_by_role('button', name='Save & publish', exact=True)).to_be_enabled()
    expect(share.get_by_label('Ready-to-send message')).to_have_value(re.compile('Vous êtes chaleureusement invités'))
    # Reproduce the supplied Arabic mobile card using the real publish handler.
    page.get_by_label('Couple names', exact=True).fill('\u0623\u064a\u0645\u0646 & \u0628\u0644\u0642\u064a\u0633')
    page.get_by_role('textbox', name='Language', exact=True).fill('Arabic')
    page.get_by_role('button', name='Save & publish', exact=True).click()
    expect(page.get_by_role('button', name='Save & publish', exact=True)).to_be_enabled()
    expect(share.get_by_label('Ready-to-send message')).to_have_value(re.compile('\u064a\u0633\u0639\u062f\u0646\u0627 \u062f\u0639\u0648\u062a\u0643\u0645'))
    share.get_by_role('button', name='Copy message', exact=True).click()
    assert url in page.evaluate('window.testCopiedText')
    share.evaluate('(element) => element.scrollIntoView({block:"start",behavior:"instant"})')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    guest.set_viewport_size({"width": 411, "height": 697})
    guest.reload()
    guest.emulate_media(reduced_motion='reduce')
    guest.locator('.inviteEnvelope').click()
    expect(guest.locator('.inviteEnvelope')).to_have_count(0)
    expect(guest.locator('.inviteReveal')).not_to_have_attribute('inert', '')
    expect(guest.locator('.invitePersonalisedCover h2')).to_have_text('\u0623\u064a\u0645\u0646 & \u0628\u0644\u0642\u064a\u0633')
    assert abs(icon.bounding_box()['width'] - 24) < .1, icon.bounding_box()
    guest.screenshot(path=str(root.parent / 'artifacts/verification/guest-arabic-mobile.png'), full_page=True)
    page.get_by_role("button", name="Save & unpublish", exact=True).click()
    expect(page.get_by_role("button", name="Save & unpublish", exact=True)).to_be_enabled()
    expect(share.get_by_text('Invitation unpublished', exact=True)).to_be_visible()
    expect(share.locator('a')).to_have_count(0)
    guest.reload()
    expect(guest.get_by_role("alert")).to_contain_text("not available")
    browser.close()
print("Passed admin publish, saved mood, final artwork safety, guest privacy and unpublish through real API handlers.")
