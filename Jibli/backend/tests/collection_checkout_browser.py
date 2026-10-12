"""Required fields and unauthenticated checkout drafts for every collection."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

rows=[]
with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    for collection in ['weddings','engagements','birthdays','openings','graduations','family','others']:
        context=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
        page=context.new_page()
        page.goto('http://localhost:5173/invitations/'+collection)
        page.locator('.weddingDesignCard').first.click()
        page.locator('.invitationWhatsappBtn').click()
        assert '/invitations/'+collection in page.url
        for field in page.locator('.invitationForm input[required]').all():
            kind=field.get_attribute('type')
            field.fill('2028-02-29' if kind=='date' else '00:00' if kind=='time' else 'Test celebration')
        # School registration date/time are optional but must persist when supplied.
        page.locator('.invitationForm input[type=date]').fill('2028-02-29')
        page.locator('.invitationForm input[type=time]').fill('00:00')
        page.locator('.invitationWhatsappBtn').click()
        page.wait_for_url('**/login**')
        drafts=page.evaluate('Object.entries(localStorage).filter(([key])=>key.startsWith("jibli-payment-")).map(([,value])=>JSON.parse(value))')
        assert len(drafts)==1
        assert drafts[0]['product_key'].startswith('invitation:'+collection+':'),drafts
        assert json.loads(drafts[0]['details'])['invitation']['details']['date']=='2028-02-29'
        rows.append({'collection':collection,'blankBlocked':True,'checkoutDraftPreserved':True})
        print('Checkout validation passed '+collection,flush=True)
        context.close()
    browser.close()
out=Path(__file__).resolve().parents[3]/'artifacts/verification/collection-checkout.json'
out.write_text(json.dumps(rows,indent=2))
