"""Local language, accessibility, validation and persistent draft checks."""
import os
from playwright.sync_api import sync_playwright, expect

BASE = os.getenv("PLATFORM_BASE_URL", "http://127.0.0.1:5173")
with sync_playwright() as p:
    browser = p.chromium.launch(channel=None if os.getenv("CI") else "msedge", headless=True)
    for language in ["fr", "ar"]:
        context = browser.new_context(viewport={"width": 390, "height": 844})
        context.add_init_script(f"localStorage.setItem('jibli_lang', '{language}')")
        page = context.new_page()
        for path in ["/", "/login", "/register", "/invitations/weddings", "/invitations/others", "/gaming", "/terms", "/privacy", "/refund"]:
            page.goto(BASE + path)
            expect(page.locator("html")).to_have_attribute("dir", "rtl" if language == "ar" else "ltr")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (language, path)
        page.goto(BASE + "/invitations/weddings")
        page.locator(".weddingDesignCard").first.click()
        name = page.locator(".invitationForm input").first
        expect(name).to_have_attribute("required", "")
        page.locator(".invitationWhatsappBtn").click()
        assert "/invitations/weddings" in page.url
        name.fill("Amira & Youssef")
        page.get_by_role("button", name="Midnight theme", exact=True).click()
        page.locator(".invitationForm select").select_option("Arabic")
        page.reload()
        expect(page.locator(".invitationForm input").first).to_have_value("Amira & Youssef")
        expect(page.locator(".invitationForm select")).to_have_value("Arabic")
        expect(page.locator(".animatedInvite")).to_have_class("animatedInvite inviteMood-midnight ")
        if language == "ar":
            expect(page.get_by_label("اسما العروسين", exact=True)).to_be_visible()
        else:
            expect(page.get_by_label("Prénoms du couple", exact=True)).to_be_visible()
        assert page.locator(".invitationForm input").first.evaluate("e => getComputedStyle(e).color") == "rgb(17, 17, 17)"
        page.locator(".invitationWhatsappBtn").click()
        page.wait_for_url("**/login**")
        draft = page.evaluate("JSON.parse(Object.entries(localStorage).find(([k]) => k.startsWith('jibli-payment-'))[1])")
        import json
        saved = json.loads(draft["details"])["invitation"]
        assert saved["mood"] == "midnight"
        assert saved["details"]["couple"] == "Amira & Youssef"
        context.close()
    browser.close()
print("French/Arabic mobile layouts, RTL, required names, colour contrast and persistent checkout drafts passed.")
