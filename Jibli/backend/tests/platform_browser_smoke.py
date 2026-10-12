"""Read-only local UI audit; no account creation, orders or real messages."""
import os
import json
from itertools import product
from pathlib import Path

from playwright.sync_api import sync_playwright, expect

BASE = os.getenv("PLATFORM_BASE_URL", "http://127.0.0.1:5173")
COLLECTIONS = ["weddings", "engagements", "birthdays", "openings", "graduations", "family", "others"]
ROUTES = ["/", "/gaming", "/invitations", *[f"/invitations/{slug}" for slug in COLLECTIONS],
          "/login", "/register", "/about", "/contact", "/terms", "/privacy", "/refund", "/not-a-real-route"]
results = []
with sync_playwright() as p:
    browser = p.chromium.launch(channel=None if os.getenv("CI") else "msedge", headless=True)
    for width, language in product([320, 390, 768, 1440], ["en", "fr", "ar"]):
        page = browser.new_page(viewport={"width": width, "height": 900})
        page.add_init_script(f"localStorage.setItem('jibli_lang', '{language}')")
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        for route in ROUTES:
            errors.clear()
            page.goto(BASE + route, wait_until="domcontentloaded")
            expect(page.locator("h1").first).to_be_visible()
            page.evaluate('document.querySelectorAll("img").forEach(e => e.loading = "eager")')
            page.evaluate('Promise.all([...document.images].map(image => image.decode().catch(() => {})))')
            data = page.evaluate("""() => ({
                overflow: document.documentElement.scrollWidth > innerWidth,
                brokenImages: [...document.images].filter(e => e.complete && !e.naturalWidth).map(e => e.getAttribute('src')),
                h1: document.querySelector('h1')?.textContent
            })""")
            assert page.locator("html").get_attribute("dir") == ("rtl" if language == "ar" else "ltr")
            results.append({"route": route, "width": width, "language": language, "errors": list(errors), **data})
        for route in ["/payment", "/request", "/admin", "/account", "/tracking"]:
            page.goto(BASE + route, wait_until="domcontentloaded")
            page.wait_for_url("**/login**")
            results.append({"route": route, "width": width, "guestProtected": True})
        print(f"Routes checked at {width}px in {language}", flush=True)
        page.close()
    browser.close()
output=Path(__file__).resolve().parents[3]/"artifacts/verification/platform-routes.json"
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps(results, indent=2))
failures = [row for row in results if row.get("overflow") or row.get("brokenImages") or row.get("errors")]
assert not failures, json.dumps(failures, indent=2)
print(f"Passed {len(results)} route/viewport checks. Invitation interactions use invitation_matrix_browser.py.")
