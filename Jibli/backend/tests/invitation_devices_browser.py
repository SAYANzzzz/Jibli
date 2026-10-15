"""Cross-engine invitation checks; device settings are emulated, not hardware tests."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.getenv('PLATFORM_BASE_URL', 'http://127.0.0.1:5173')
OUT = Path(__file__).resolve().parents[3] / 'artifacts/verification'
profiles = [('desktop', 1440, 900, False), ('small-phone', 320, 568, True),
            ('android-portrait', 393, 851, True), ('phone-landscape', 851, 393, True),
            ('tablet-portrait', 768, 1024, True), ('tablet-landscape', 1024, 768, True)]
if os.getenv('INVITATION_PROFILE'):
    profiles = [profile for profile in profiles if profile[0] == os.environ['INVITATION_PROFILE']]
rows = []
with sync_playwright() as p:
    for engine in os.getenv('INVITATION_ENGINES', 'chromium,firefox,webkit').split(','):
        browser = getattr(p, engine).launch(**({'channel': 'msedge'} if engine == 'chromium' else {}), headless=True, timeout=20000)
        for name, width, height, touch in profiles:
            settings = {'viewport': {'width': width, 'height': height}, 'has_touch': touch,
                        'device_scale_factor': 2 if touch else 1}
            if engine != 'firefox': settings['is_mobile'] = touch
            context = browser.new_context(**settings)
            state = {'status': 200}
            invitation = {'title': 'Our celebration', 'image': '', 'mood': 'garden', 'published': True,
                          'details': {'couple': '\u0623\u064a\u0645\u0646 & \u0628\u0644\u0642\u064a\u0633',
                                      'language': 'Arabic', 'date': '2028-02-29', 'time': '18:30',
                                      'venue': 'Tunis, Tunisia', 'note': 'We look forward to seeing you.'}}
            context.route('**/api/invitations/**', lambda route: route.fulfill(status=state['status'], json={'invitation': invitation}))
            context.route('https://maps.google.com/**', lambda route: route.fulfill(body='<html>Map</html>', content_type='text/html'))
            page = context.new_page()
            page.set_default_timeout(10000)
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            activate = lambda locator: locator.tap() if touch else locator.click()
            page.goto(BASE + '/invite/' + 'c' * 32)
            # Expand before opening, then pause during the opening animation.
            activate(page.locator('.inviteExpandButton'))
            activate(page.locator('.inviteEnvelope'))
            activate(page.locator('.inviteMotionToggle'))
            expect(page.locator('.inviteEnvelope')).to_have_count(0)
            expect(page.locator('.inviteReveal')).not_to_have_attribute('inert', '')
            expect(page.locator('.invitePersonalisedCover h2')).to_have_text(invitation['details']['couple'])
            assert abs(page.locator('.invitePersonalisedCover > svg').bounding_box()['width'] - 24) < .1
            reveal = page.locator('.inviteReveal')
            reveal.evaluate('(el) => el.scrollTop = el.scrollHeight')
            assert reveal.evaluate('(el) => el.scrollTop > 0')
            if engine == 'chromium' and name == 'android-portrait':
                reveal.evaluate('(el) => el.scrollTop = 0')
                cdp = context.new_cdp_session(page)
                cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': width // 2, 'y': 650}]})
                for y in range(625, 225, -25):
                    cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': width // 2, 'y': y}]})
                    page.wait_for_timeout(16)
                cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
                page.wait_for_function('document.querySelector(".inviteReveal").scrollTop > 0')
                # Let native touch momentum finish before rotating and tapping.
                reveal.evaluate('''el => new Promise(resolve => { let previous=el.scrollTop, stable=0; function frame() { const next=el.scrollTop; stable=Math.abs(next-previous)<.1 ? stable+1 : 0; previous=next; if(stable>=12) resolve(); else requestAnimationFrame(frame); } requestAnimationFrame(frame); })''')
                cdp.detach()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            button = page.locator('.inviteExpandButton').bounding_box()
            assert button['y'] >= 0 and button['y'] + button['height'] <= height
            page.set_viewport_size({'width': height, 'height': width})
            assert reveal.evaluate('(el) => el.clientHeight > 0')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.set_viewport_size({'width': width, 'height': height})
            activate(page.locator('.inviteExpandButton'))
            expect(page.get_by_role('dialog')).to_have_count(0)
            assert page.evaluate('document.body.style.overflow !== "hidden"')
            assert '20280229' in page.locator('.inviteCalendarDownload').get_attribute('href')
            assert 'Tunis' in page.locator('.inviteLocation').last.get_attribute('href')
            page.reload()
            expect(page.locator('.inviteEnvelope')).to_be_visible()
            page.emulate_media(reduced_motion='reduce')
            activate(page.locator('.inviteEnvelope'))
            expect(page.locator('.inviteEnvelope')).to_have_count(0)
            # A failed mobile connection is recoverable without editing the URL.
            state['status'] = 503
            page.reload()
            expect(page.get_by_role('alert')).to_contain_text('Check your connection')
            state['status'] = 200
            activate(page.get_by_role('button', name='Try again'))
            expect(page.locator('.inviteEnvelope')).to_be_visible()
            invitation['image'] = '/missing-invitation-artwork.png'
            context.route('**/missing-invitation-artwork.png', lambda route: route.fulfill(status=404, body=''))
            page.reload()
            activate(page.locator('.inviteEnvelope'))
            expect(page.locator('.invitePersonalisedCover h2')).to_have_text(invitation['details']['couple'])
            assert not errors, errors
            rows.append({'engine': engine, 'profile': name, 'passed': True})
            context.close()
            print(f'Passed {engine}: {name}', flush=True)
        # Cover every collection's editable preview in each browser engine.
        context = browser.new_context(viewport={'width': 768, 'height': 1024}, has_touch=True, reduced_motion='reduce')
        context.route('https://maps.google.com/**', lambda route: route.fulfill(body='<html>Map</html>', content_type='text/html'))
        page = context.new_page()
        for collection in ['weddings', 'engagements', 'birthdays', 'openings', 'graduations', 'family', 'others']:
            page.goto(BASE + '/invitations/' + collection)
            page.locator('.weddingDesignCard').first.tap()
            page.locator('.inviteEnvelope').tap()
            expect(page.locator('.inviteEnvelope')).to_have_count(0)
            expect(page.locator('.inviteReveal')).to_be_visible()
            page.locator('.inviteExpandButton').tap()
            expect(page.get_by_role('dialog')).to_be_visible()
            page.locator('.inviteExpandButton').tap()
            expect(page.get_by_role('dialog')).to_have_count(0)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            rows.append({'engine': engine, 'collection': collection, 'previewPassed': True})
        context.close()
        browser.close()
OUT.mkdir(parents=True, exist_ok=True)
(OUT / ('invitation-devices-' + os.getenv('INVITATION_ENGINES', 'all').replace(',', '-') + '.json')).write_text(json.dumps(rows, indent=2))
print(f'Passed {len(rows)} cross-engine/device and collection preview checks.')
