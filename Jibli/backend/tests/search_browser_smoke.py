"""Verify built HTML without JavaScript, then verify metadata during SPA navigation."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

expect.set_options(timeout=15000)

root = Path(__file__).resolve().parents[2]
pages = json.loads((root / 'src/searchPages.json').read_text(encoding='utf-8'))
base = os.getenv('SEARCH_BASE_URL', 'http://127.0.0.1:5180')
with sync_playwright() as p:
    browser = p.chromium.launch(**({'channel': 'msedge'} if not os.getenv('CI') else {}), headless=True)
    context = browser.new_context(java_script_enabled=False)
    page = context.new_page()
    for path, info in pages.items():
        response = page.goto(base + path)
        assert response.status == 200, path
        expect(page).to_have_title(info['title'])
        expect(page.locator('h1')).to_be_visible()
        expect(page.locator('link[rel=canonical]')).to_have_attribute('href', 'https://www.jiblitunisia.com' + path)
        contact = '/contact' if info['language'] == 'en' else '/' + info['language'] + '/contact'
        expect(page.locator('footer a[href="' + contact + '"]')).to_have_count(1)
        expect(page.locator('html')).to_have_attribute('lang', info['language'])
    context.close()
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(base)
    page.locator('nav').first.wait_for()
    for path in ['/gaming', '/invitations', '/invitations/weddings', '/contact']:
        if path == '/invitations/weddings':
            page.locator('button.invitationTemplate.rose').click()
        else:
            page.locator('a[href="' + path + '"]').first.click()
        expect(page).to_have_title(pages[path]['title'])
        expect(page.locator('link[rel=canonical]')).to_have_attribute('href', 'https://www.jiblitunisia.com' + path)
        expect(page.locator('meta[name=description]')).to_have_attribute('content', pages[path]['description'])
        data = json.loads(page.locator('#jibli-search-data').text_content())
        assert next(node for node in data['@graph'] if node['@type'] == 'WebPage')['url'].endswith(path)
    page.locator('a[href="/login"]').first.click()
    expect(page.locator('meta[name=robots]')).to_have_attribute('content', 'noindex, nofollow')
    expect(page.locator('link[rel=canonical]')).to_have_count(0)
    for language in ['fr', 'ar']:
        page.goto(base + '/' + language + '/gaming')
        expect(page.locator('html')).to_have_attribute('lang', language)
        expect(page).to_have_title(pages['/' + language + '/gaming']['title'])
        page.locator('a[href="/' + language + '/invitations"]').first.click()
        expect(page).to_have_title(pages['/' + language + '/invitations']['title'])
        expect(page.locator('link[rel=canonical]')).to_have_attribute('href', 'https://www.jiblitunisia.com/' + language + '/invitations')
        expect(page.locator('html')).to_have_attribute('lang', language)
    assert not errors, errors
    browser.close()
print(f'PASS: {len(pages)} public pages readable without JavaScript; titles, canonicals and schema follow SPA navigation; private routes noindex.')
