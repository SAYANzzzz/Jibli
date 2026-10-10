"""Read-only local UI audit; no account creation, orders or real messages."""
import os
import json
from pathlib import Path

from playwright.sync_api import sync_playwright, expect

BASE = os.getenv("PLATFORM_BASE_URL", "http://127.0.0.1:5173")
COLLECTIONS = ["weddings", "engagements", "birthdays", "openings", "graduations", "family", "others"]
ROUTES = ["/", "/gaming", "/invitations", *[f"/invitations/{slug}" for slug in COLLECTIONS],
          "/login", "/register", "/about", "/contact", "/terms", "/privacy", "/refund", "/not-a-real-route"]
results = []
with sync_playwright() as p:
    browser = p.chromium.launch(channel=None if os.getenv("CI") else "msedge", headless=True)
    for width in [390, 1440]:
        page = browser.new_page(viewport={"width": width, "height": 900})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        for route in ROUTES:
            errors.clear()
            page.goto(BASE + route, wait_until="domcontentloaded")
            page.evaluate('document.querySelectorAll("img").forEach(e => e.loading = "eager")')
            page.wait_for_timeout(250)
            data = page.evaluate("""() => ({
                overflow: document.documentElement.scrollWidth > innerWidth,
                brokenImages: [...document.images].filter(e => e.complete && !e.naturalWidth).map(e => e.getAttribute('src')),
                h1: document.querySelector('h1')?.textContent
            })""")
            results.append({"route": route, "width": width, "errors": list(errors), **data})
        for route in ["/payment", "/request", "/admin", "/account", "/tracking"]:
            page.goto(BASE + route, wait_until="domcontentloaded")
            page.wait_for_url("**/login**")
            results.append({"route": route, "width": width, "guestProtected": True})
        page.close()
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    for slug in COLLECTIONS:
        page.goto(BASE + "/invitations/" + slug)
        page.locator(".weddingDesignCard").first.click()
        page.locator("input[type=time]").fill("18:30")
        expect(page.locator(".inviteEnvelope")).to_be_visible()
        page.locator("input[type=date]").fill("2027-06-20")
        page.locator(".invitationForm input").first.fill("Amira & Youssef")
        page.get_by_role("button", name="Midnight theme", exact=True).click()
        page.get_by_role("button", name="Open invitation:", exact=False).click()
        expect(page.locator(".inviteWelcome h2")).to_have_text("Amira & Youssef")
        expect(page.locator(".inviteCountdown")).to_be_attached()
        assert "DTSTART" in page.get_by_role("link", name="Save the date").get_attribute("href")
        page.locator("input[type=date]").fill("")
        expect(page.locator(".inviteCountdown")).to_have_count(0)
        page.get_by_role("button", name="Replay", exact=True).click()
        expect(page.locator(".inviteEnvelope")).to_be_visible()
        assert not errors, errors
    browser.close()
Path(__file__).with_name("platform_browser_results.json").write_text(json.dumps(results, indent=2))
failures = [row for row in results if row.get("overflow") or row.get("brokenImages") or row.get("errors")]
assert not failures, json.dumps(failures, indent=2)
print(f"Passed {len(results)} route/viewport checks and seven invitation preview regressions.")
