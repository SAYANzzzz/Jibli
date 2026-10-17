"""Upload -> Save & publish -> guest collage, using real handlers and fake storage."""
import base64
import json
import os
import sys
import time
from pathlib import Path
from unittest.mock import MagicMock, patch
from urllib.parse import urlparse
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dotenv import dotenv_values
from fastapi import FastAPI
from fastapi.testclient import TestClient
from playwright.sync_api import sync_playwright, expect
from app.auth import get_current_profile, get_current_user
from app.invitations import router as invitation_router
from app.payments import router as payment_router
from test_payments import Database

root = Path(__file__).resolve().parents[2]
base = os.getenv("PLATFORM_BASE_URL", "http://127.0.0.1:5173")
project = urlparse(os.getenv("VITE_SUPABASE_URL") or dotenv_values(root / ".env.local")["VITE_SUPABASE_URL"]).hostname.split(".")[0]
user = {"id": str(uuid4()), "email": "collage@example.invalid", "aud": "authenticated", "role": "authenticated"}
encode = lambda value: base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip("=")
token = f"{encode({'alg': 'HS256', 'typ': 'JWT'})}.{encode({'sub': user['id'], 'exp': int(time.time()) + 3600, 'aud': 'authenticated'})}.test"
session = {"access_token": token, "refresh_token": "test-only", "token_type": "bearer", "expires_at": int(time.time()) + 3600, "expires_in": 3600, "user": user}
payment_id = str(uuid4())
details = {"couple": "Amira & Youssef", "date": "2027-06-20", "time": "18:30", "venue": "Tunis", "language": "English", "mapsUrl": "https://maps.app.goo.gl/example"}
invitation = {"title": "Wedding", "image": "/invitations/weddings/arabesque-burgundy.png", "mood": "garden", "certificate": False, "details": details}
db = Database()
db.rows["d17_orders"] = [{"id": payment_id, "user_id": user["id"], "product_key": "invitation:weddings:arabesque-burgundy", "title": "Wedding", "kind": "invitation", "amount": 15, "phone": "92123456", "authorization": "001234", "review_note": "", "status": "confirmed", "delivery": "", "created_at": "2026-10-10T00:00:00Z", "details": json.dumps({"request": "Private request", "invitation": invitation})}]
db.storage = MagicMock()
db.storage.from_.return_value.get_public_url.side_effect = lambda path: f"https://photos.test/{path}"
app = FastAPI()
app.include_router(payment_router)
app.include_router(invitation_router)
app.dependency_overrides[get_current_user] = lambda: user
app.dependency_overrides[get_current_profile] = lambda: {**user, "role": "admin"}
client = TestClient(app)
pending_uploads = []
picture = (root / "public/games/pubg-mobile.jpg").read_bytes()


def forward(route):
    request = route.request
    path = urlparse(request.url).path
    response = client.request(request.method, path.removeprefix("/api"), content=request.post_data_buffer, headers={"content-type": request.headers.get("content-type", "application/json")})
    assert response.status_code == 200, (path, response.text)
    route.fulfill(status=response.status_code, content_type="application/json", body=response.text)


def handle(route):
    path = urlparse(route.request.url).path
    if path == "/auth/v1/user": value = user
    elif "/rest/v1/profiles" in path: value = {"full_name": "Test Admin", "avatar_url": None}
    elif path == "/api/me/profile": value = {**user, "role": "admin"}
    elif path == "/api/admin/orders": value = {"orders": []}
    elif path == "/api/invitations/photos": pending_uploads.append(route); return
    else: forward(route); return
    route.fulfill(status=200, content_type="application/json", body=json.dumps(value))


with patch("app.payments.get_supabase_admin", return_value=db), patch("app.invitations.get_supabase_admin", return_value=db), sync_playwright() as p:
    browser = p.chromium.launch(**({"channel": "msedge"} if not os.getenv("CI") else {}), headless=True)
    context = browser.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
    context.add_init_script("localStorage.setItem(" + json.dumps("sb-" + project + "-auth-token") + "," + json.dumps(json.dumps(session)) + ");")
    for pattern in ["**/api/**", "**/auth/v1/**", "**/rest/v1/**"]: context.route(pattern, handle)
    context.route("https://photos.test/**", lambda route: route.fulfill(body=picture, content_type="image/jpeg"))
    page = context.new_page()
    page.goto(base + "/admin")
    page.get_by_text("Edit & publish guest invitation", exact=True).click()
    page.locator('.venuePhotoUpload input[type=file]').set_input_files([{"name": f"photo-{i}.jpg", "mimeType": "image/jpeg", "buffer": picture} for i in range(3)])
    save = page.locator('.invitationEditor .d17Actions button.primaryBtn')
    expect(save).to_be_disabled()
    for _ in range(3):
        for attempt in range(100):
            if pending_uploads: break
            page.wait_for_timeout(30)
        assert pending_uploads, "Upload request never arrived"
        expect(save).to_be_disabled()
        forward(pending_uploads.pop(0))
    expect(save).to_be_enabled()
    expect(page.locator('.venuePhotoPreviews img')).to_have_count(3)
    save.click()
    preview = page.get_by_role('link', name='Preview invitation', exact=True)
    expect(preview).to_be_visible()
    saved = json.loads(db.rows['d17_orders'][0]['details'])['invitation']
    assert all(saved['details'].get(f'venuePhoto{i}') for i in range(1, 4))
    assert saved['published'] is True
    assert saved['details']['mapsUrl'] == details['mapsUrl']
    guest_url = preview.get_attribute('href')
    print('Three uploads -> publish waits for uploads -> all photos and Maps link saved.', flush=True)

    designs = ['weddings/arabesque-burgundy.png', 'engagements/garden-hands.jfif', 'birthdays/blue-cake.jfif', 'openings/bold-coffee.jfif', 'graduations/blue-florals.jfif', 'family/family-roots.jfif', 'others/weekly-star-blue.jfif']
    guest = context.new_page()
    for width, height in [(390, 844), (1280, 900)]:
        guest.set_viewport_size({"width": width, "height": height})
        for design in designs:
            payload = {**saved, 'image': '/invitations/' + design, 'certificate': 'weekly-star' in design, 'details': {**saved['details'], 'venue': '', 'language': 'Arabic'}}
            response = client.put(f'/admin/payments/{payment_id}/invitation', json=payload)
            assert response.status_code == 200, response.text
            guest.goto(guest_url)
            guest.locator('.inviteEnvelope').click()
            guest.locator('.inviteEnvelope').wait_for(state='detached')
            collage = guest.locator('.invitePhotoCollage')
            expect(collage.locator('img')).to_have_count(3)
            collage.scroll_into_view_if_needed()
            collage.locator('img').evaluate_all('(imgs)=>Promise.all(imgs.map(img=>img.decode()))')
            boxes = collage.locator('figure').evaluate_all('(els)=>els.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})')
            assert boxes[2]['y'] > boxes[0]['y'] and boxes[2]['y'] < boxes[0]['y'] + boxes[0]['h'], boxes
            assert boxes[0]['x'] < boxes[2]['x'] < boxes[1]['x'], boxes
            assert guest.evaluate('document.documentElement.scrollWidth <= innerWidth')
            expect(guest.locator('.inviteClosingLink')).to_have_attribute('href', 'https://www.jiblitunisia.com/invitations')
            if width == 390 and design == designs[0]: guest.screenshot(path=str(root.parent / 'artifacts/verification/three-photo-collage.png'))
        print(f'{width}px: all seven collections, including certificate without venue, show the saved three-photo collage.', flush=True)
    browser.close()
