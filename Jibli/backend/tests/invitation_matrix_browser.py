"""Read-only browser matrix with simulated guest API responses; no external writes."""
import json
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[3]
BASE = os.environ.get("PLATFORM_BASE_URL", "http://localhost:5173")
OUT = ROOT / "artifacts" / "verification"
OUT.mkdir(parents=True, exist_ok=True)
collections = {
    "WeddingInvitations": "weddings", "EngagementInvitations": "engagements",
    "BirthdayInvitations": "birthdays", "BusinessOpeningInvitations": "openings",
    "GraduationInvitations": "graduations", "FamilyGatheringInvitations": "family",
    "OtherInvitations": "others",
}
designs = []
for filename, collection in collections.items():
    source = (ROOT / "Jibli/src/pages" / (filename + ".tsx")).read_text(encoding="utf-8")
    for key in re.findall(r'"?\bid"?: "([^"]+)"', source):
        paths = list((ROOT / "Jibli/public/invitations" / collection).glob(key + ".*"))
        image = next((p for p in paths if p.suffix == ".png"), paths[0])
        designs.append((key, "/" + image.relative_to(ROOT / "Jibli/public").as_posix()))

results, failures, errors = [], [], []
payload = {}
with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    context = browser.new_context(reduced_motion="reduce")
    context.route("**/api/invitations/**", lambda route: route.fulfill(json={"invitation": payload}))
    # Maps are an external embed; test their URL rather than loading Google in each case.
    context.route("https://maps.google.com/**", lambda route: route.fulfill(body="<html>Map placeholder</html>", content_type="text/html"))
    page = context.new_page()
    page.set_default_timeout(5000)
    page.on("pageerror", lambda error: errors.append(str(error)))
    for width in [320, 390, 768, 1440]:
        page.set_viewport_size({"width": width, "height": 900})
        for key, image in designs:
            for scenario, name, language in [
                ("normal", "Manef Yakoubi", "English"),
                ("long", "Alexandria Catherine Ben Youssef & Mohamed Alexander Horchani", "French"),
                ("arabic", "محمد عبد الرحمن بن يوسف و فاطمة الزهراء بنت أحمد", "Arabic"),
            ]:
                errors.clear()
                payload = {"title": key, "image": image, "mood": "original",
                    "certificate": "certificate" in key or "weekly-star" in key,
                    "details": {"name": name, "couple": name if "/weddings/" in image or "/engagements/" in image else "",
                        "date": "2028-02-29", "time": "23:59", "venue": "Tunis, Tunisia",
                        "language": language, "age": "21", "hosts": "The families", "rsvp": "+216 92123456",
                        "note": "A special day with family and friends."}}
                try:
                    page.goto(BASE + "/invite/" + "a" * 32, wait_until="domcontentloaded")
                    page.locator(".inviteEnvelope").click()
                    expect(page.locator(".inviteEnvelope")).to_have_count(0)
                    expect(page.locator(".inviteReveal")).to_be_visible()
                    page.evaluate("document.fonts.ready")
                    page.wait_for_timeout(80)
                    metrics = page.evaluate("""() => ({
                      overflow: document.documentElement.scrollWidth > innerWidth,
                      fields: [...document.querySelectorAll('.inviteArtworkField')].map(box => {
                        const span=box.querySelector('span'), rect=span.getBoundingClientRect(), b=box.getBoundingClientRect();
                        return {text:span.textContent, clipped:span.scrollWidth>box.clientWidth+1 || rect.height>b.height+1};
                      }),
                      brokenImages: [...document.images].filter(e=>e.complete&&!e.naturalWidth).map(e=>e.src),
                      caption: document.querySelector('.inviteArtworkCaption')?.textContent
                    })""")
                    assert not metrics["overflow"], "Horizontal page overflow"
                    assert not metrics["brokenImages"], metrics["brokenImages"]
                    assert not any(f["clipped"] for f in metrics["fields"]), metrics["fields"]
                    assert not errors, errors
                    if key == "disco-graduate":
                        expect(page.locator('.inviteArtworkField[data-field="name"]')).to_have_count(0)
                        expect(page.locator('.inviteArtworkCaption strong')).to_have_text(name)
                    if not payload["certificate"]:
                        expect(page.locator('.inviteMonthRow .isEventDay')).to_have_text("29")
                        assert "20280229" in page.locator('.inviteCalendarDownload').get_attribute('href')
                        assert "Tunis" in page.locator('.inviteLocation').last.get_attribute('href')
                    if scenario == "normal":
                        page.locator('.inviteExpandButton').click()
                        expect(page.locator('[role="dialog"]')).to_be_visible()
                        page.keyboard.press('Escape')
                        expect(page.locator('[role="dialog"]')).to_have_count(0)
                    results.append({"design":key,"width":width,"scenario":scenario,"status":"passed"})
                except Exception as error:
                    failure = {"design":key,"width":width,"scenario":scenario,"error":str(error)[:1000]}
                    failures.append(failure)
                    print(json.dumps(failure, ensure_ascii=False), flush=True)
                    if len(failures) <= 12:
                        page.screenshot(path=str(OUT / f"failure-{key}-{width}-{scenario}.png"))
            print(f"Checked {key} at {width}px; failures={len(failures)}", flush=True)
    browser.close()
(OUT / "invitation-matrix.json").write_text(json.dumps({"passed":results,"failures":failures},indent=2),encoding="utf-8")
print(f"Passed {len(results)}; failed {len(failures)}",flush=True)
assert not failures, json.dumps(failures[:10],indent=2)
