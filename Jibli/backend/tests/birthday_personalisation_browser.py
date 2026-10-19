"""Birthday upload -> crop -> checkout -> guest proof, with isolated auth/API fixtures."""
import base64
import json
import os
import time
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4

from dotenv import dotenv_values
from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[2]
base = os.getenv("PLATFORM_BASE_URL", "http://127.0.0.1:5174")
project = urlparse(dotenv_values(root / ".env.local")["VITE_SUPABASE_URL"]).hostname.split(".")[0]
user = {"id": str(uuid4()), "email": "birthday@example.invalid", "aud": "authenticated", "role": "authenticated"}
encode = lambda value: base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip("=")
token = f"{encode({'alg': 'HS256', 'typ': 'JWT'})}.{encode({'sub': user['id'], 'exp': int(time.time()) + 3600, 'aud': 'authenticated'})}.test"
session = {"access_token": token, "refresh_token": "test-only", "token_type": "bearer", "expires_at": int(time.time()) + 3600, "expires_in": 3600, "user": user}
payments = []
uploads = []


def handle(route):
    request = route.request
    path = urlparse(request.url).path
    if path == "/auth/v1/user": result = user
    elif "/rest/v1/profiles" in path: result = {"full_name": "Birthday Test", "avatar_url": None}
    elif path == "/api/me/profile": result = {**user, "role": "user"}
    elif path == "/api/payments": result = {"payments": payments}
    elif path == "/api/invitations/photos": uploads.append(route); return
    elif path == "/api/payments/checkout":
        body = request.post_data_json
        payments.append({**body, "id": str(uuid4()), "title": "Birthday", "amount": 10, "kind": "invitation", "authorization": None, "status": "pending_payment", "delivery": "", "review_note": "", "created_at": "2026-10-17T00:00:00Z"})
        result = {"payment": payments[-1]}
    elif path == "/api/invitations/birthday-browser-test": result = {"invitation": json.loads(payments[-1]["details"])["invitation"]}
    else: result = {}
    route.fulfill(status=200, content_type="application/json", body=json.dumps(result))


with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    context = browser.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
    context.add_init_script("localStorage.setItem(" + json.dumps("sb-" + project + "-auth-token") + "," + json.dumps(json.dumps(session)) + ");")
    for pattern in ["**/api/**", "**/auth/v1/**", "**/rest/v1/**"]: context.route(pattern, handle)
    context.route("https://photos.test/client.png", lambda route: route.fulfill(path=str(root / "public/Logo.png")))
    context.route("https://maps.google.com/**", lambda route: route.fulfill(body="Map"))
    page = context.new_page()
    page.goto(base + "/invitations/birthdays")
    age_designs = {0, 1, 3, 6, 7}
    for index in range(8):
        page.locator(".weddingDesignCard").nth(index).click()
        expect(page.get_by_label("Age on the invitation", exact=True)).to_have_count(1 if index in age_designs else 0)
        expect(page.locator(".birthdayPhotoUpload input[type=file]")).to_have_count(1)
        page.locator("button.invitationBack").click()
    page.locator(".weddingDesignCard").first.click()
    page.get_by_label("Birthday person's name", exact=True).fill("Nour")
    page.get_by_label("Age on the invitation", exact=True).fill("7")
    page.locator("input[type=date]").fill("2027-06-20")
    page.locator("input[type=time]").fill("19:30")
    page.get_by_label("Venue and city").fill("Tunis")
    page.locator(".birthdayPhotoUpload input[type=file]").set_input_files(str(root / "public/Logo.png"))
    expect(page.locator(".birthdayPhotoUpload input[type=file]")).to_be_disabled()
    page.get_by_role("button", name="Continue to D17 payment").click()
    assert "/invitations/birthdays" in page.url
    assert uploads
    uploads.pop().fulfill(status=200, json={"url": "https://photos.test/client.png"})
    expect(page.locator(".birthdayPhotoThumbnail")).to_be_visible()
    for label, value in [("Photo zoom", "1.5"), ("Photo horizontal position", "0"), ("Photo vertical position", "100")]:
        page.get_by_label(label, exact=True).fill(value)
    page.locator(".inviteEnvelope").click()
    expect(page.locator("[data-birthday-age='7']")).to_have_count(1)
    expect(page.locator(".birthdayPersonalisedArtwork [data-birthday-portrait]")).to_have_count(1)
    page.get_by_role("button", name="Continue to D17 payment").click()
    page.get_by_label("Your WhatsApp number").fill("92123456")
    page.get_by_role("button", name="Show payment details").click()
    expect(page.locator(".d17Amount")).to_contain_text("10")
    details = json.loads(payments[-1]["details"])["invitation"]["details"]
    assert details["age"] == "7" and details["birthdayPhoto"] == "https://photos.test/client.png"
    assert [details[key] for key in ["birthdayPhotoZoom", "birthdayPhotoX", "birthdayPhotoY"]] == ["1.5", "0", "100"]
    page.goto(base + "/invite/birthday-browser-test")
    page.locator(".inviteEnvelope").click()
    expect(page.locator("[data-birthday-age='7']")).to_have_count(1)
    expect(page.locator(".birthdayPersonalisedArtwork [data-birthday-portrait]")).to_have_count(1)
    browser.close()
    print("PASS: eight design capabilities; upload blocks checkout; age, photo and crop survive checkout and guest rendering.")
