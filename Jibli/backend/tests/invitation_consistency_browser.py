"""Built-in templates prepare names before reveal and ignore incorrect legacy types."""
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[2]
source = (root / 'src/invitationTemplates.ts').read_text(encoding='utf-8')
images = list(dict.fromkeys(re.findall(r'"image": "(/invitations/[^" ]+\.jfif)"', source)
                           + re.findall(r'image: "(/invitations/[^" ]+\.jfif)"', source)))
assert len(images) == 40, len(images)
base = os.getenv('PLATFORM_BASE_URL', 'http://127.0.0.1:5173')
with sync_playwright() as p:
    browser = p.chromium.launch(**({'channel': 'msedge'} if not os.getenv('CI') else {}), headless=True)
    context = browser.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
    page = context.new_page()
    fixture = {}
    context.route('**/invitations/consistency-*', lambda route: route.fulfill(json={'invitation': fixture}))
    context.route('https://maps.google.com/**', lambda route: route.fulfill(body='Map'))
    page.goto(base)
    page.locator('nav').first.wait_for()
    for index, image in enumerate(images):
        certificate = bool(re.search('certificate|weekly-star', image))
        fixture = {'title': 'Regression test', 'image': image.replace('.jfif', '.png'),
                   'certificate': not certificate, 'details': {
                       'name': 'Client Name', 'couple': 'Client & Partner', 'date': '2027-06-20',
                       'time': '19:30', 'venue': 'Client Venue', 'language': 'French',
                       'note': 'Client Message', 'rsvp': 'Client Contact'}}
        page.evaluate("path=>{history.pushState({},'',path);window.dispatchEvent(new PopStateEvent('popstate'));}",
                      f'/invite/consistency-{index}')
        envelope = page.locator('.inviteEnvelope')
        envelope.wait_for()
        assert not page.locator('.inviteReveal').is_visible(), image
        assert page.locator('.inviteArtworkField,.inviteArtworkCaption').count() > 0, image
        prepared = ' '.join(page.locator('.inviteArtworkField[data-field=name],.inviteArtworkCaption').all_text_contents())
        assert 'Client' in prepared, image
        expect(page.locator('.animatedInvite')).to_have_attribute('dir', 'ltr')
        assert page.locator('.inviteStoryCalendar').count() == (0 if certificate else 1), image
        envelope.click()
        expect(envelope).to_have_count(0)
        expect(page.locator('.inviteReveal')).not_to_have_attribute('inert', '')
    print(f'PASS: {len(images)} templates; names prepared before reveal, saved details, language and correct type despite inverted legacy flag.')
    browser.close()
