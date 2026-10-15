"""Live form-to-preview and whitespace validation across all seven collections."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

rows=[]
with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    for width in [320,1440]:
        for collection in ['weddings','engagements','birthdays','openings','graduations','family','others']:
            context=browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce')
            context.route('https://maps.google.com/**',lambda route:route.fulfill(body='<html>Map</html>',content_type='text/html'))
            page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto('http://localhost:5173/invitations/'+collection)
            page.locator('.weddingDesignCard').first.click()
            form=page.locator('.invitationForm')
            for field in form.locator('input[required]').all():
                kind=field.get_attribute('type')
                field.fill('2028-02-29' if kind=='date' else '00:00' if kind=='time' else '   ')
            page.locator('.invitationWhatsappBtn').click()
            assert '/invitations/'+collection in page.url
            assert form.evaluate('(f)=>!f.checkValidity()')
            name=form.locator('input:not([type]),input[type=text]').first
            name.fill('Amira & Youssef')
            form.locator('input[type=date]').fill('2028-02-29')
            form.locator('input[type=time]').fill('00:00')
            for detail in form.locator('details').all(): detail.evaluate('(d)=>d.open=true')
            textfields=form.locator('input:not([type]),input[type=text]')
            for field in textfields.all()[1:]: field.fill('Preview detail Tunis')
            note=form.locator('textarea');note.fill('Special message <script>window.previewInjected=1</script>')
            page.locator('.inviteEnvelope').click()
            expect(page.locator('.inviteEnvelope')).to_have_count(0)
            expect(page.locator('.invitePersonalNote')).to_have_text('Special message <script>window.previewInjected=1</script>')
            for label,value in [('normal','Amira & Youssef'),('arabic','???? & ?????'),('maximum','Alexandria '*14+'Youssef')]:
                name.fill(value)
                value=name.input_value()
                page.evaluate('document.fonts.ready')
                page.wait_for_timeout(100)
                preview=page.locator('.inviteReveal')
                # Split name slots may use separate spans for each partner.
                text=preview.inner_text()
                assert all(part.strip().casefold() in text.casefold() for part in value.split('&')),(collection,label,text[:200])
                metrics=page.eval_on_selector_all('.inviteArtworkField','boxes=>boxes.map(box=>{const s=box.querySelector("span");return s.scrollWidth<=box.clientWidth+1 && s.getBoundingClientRect().height<=box.getBoundingClientRect().height+1})')
                assert all(metrics),(collection,label,metrics)
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(collection,label)
                assert not page.evaluate('Boolean(window.previewInjected)')
                assert not errors,errors
                rows.append({'collection':collection,'width':width,'scenario':label,'passed':True})
            page.screenshot(path=f'artifacts/verification/live-{collection}-{width}.png')
            context.close()
    browser.close()
Path('artifacts/verification/live-inputs.json').write_text(json.dumps(rows,indent=2))
print(f'Passed {len(rows)} live name updates, all collection whitespace checks, long text fitting and escaped message previews.')
