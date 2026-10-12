"""Read-only checks against production; never signs in or submits orders."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

rows=[]
with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    page=browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
    page.set_default_timeout(15000)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    for path in ['/', '/gaming','/invitations','/invitations/weddings','/invitations/engagements',
        '/invitations/birthdays','/invitations/openings','/invitations/graduations',
        '/invitations/family','/invitations/others','/login','/register','/about',
        '/contact','/terms','/privacy','/refund','/not-a-real-route']:
        errors.clear()
        response=page.goto('https://www.jiblitunisia.com'+path,wait_until='domcontentloaded')
        page.locator('h1').first.wait_for()
        assert not errors,errors
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),path
        if path.startswith('/invitations/'):
            page.locator('.weddingDesignCard').first.click()
            expect(page.locator('.inviteWaxSeal')).to_be_visible()
            page.locator('.inviteEnvelope').click()
            expect(page.locator('.inviteEnvelope')).to_have_count(0)
            expect(page.locator('.inviteReveal')).to_be_visible()
        rows.append({'route':path,'status':response.status,'errors':list(errors)})
        print('Production checked '+path,flush=True)
    browser.close()
out=Path(__file__).resolve().parents[3]/'artifacts/verification/production-smoke.json'
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(rows,indent=2))
print('Production public pages and seven invitation collections passed.')
