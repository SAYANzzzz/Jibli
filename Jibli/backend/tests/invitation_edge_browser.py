"""Boundary cases for drafts, validation, missing artwork and guest errors."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:5173"
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(channel="msedge",headless=True)
    for stored in ['{invalid', '{}', '[]', '"wrong type"', '{"couple":42,"rsvp":null}']:
        context=browser.new_context(viewport={"width":390,"height":844},reduced_motion="reduce")
        page=context.new_page()
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(BASE+'/invitations/weddings')
        page.evaluate('(value)=>localStorage.setItem("jibli-details-weddings",value)',stored)
        page.reload()
        page.locator('.weddingDesignCard').first.click()
        page.wait_for_timeout(100)
        results.append({"case":"stored draft "+stored,"errors":errors,"form":page.locator('.invitationForm').count()})
        context.close()
    context=browser.new_context(viewport={"width":390,"height":844},reduced_motion="reduce")
    page=context.new_page()
    page.goto(BASE+'/invitations/weddings')
    page.locator('.weddingDesignCard').first.click()
    page.locator('.invitationWhatsappBtn').click()
    assert '/invitations/weddings' in page.url
    for field,value in [('input[maxlength="160"]','Amira & Youssef'),('input[type=date]','2028-02-29'),('input[type=time]','00:00'),('input[maxlength="240"]','Tunis')]:
        page.locator('.invitationForm '+field).first.fill(value)
    page.locator('.inviteEnvelope').focus()
    page.keyboard.press('Enter')
    expect(page.locator('.inviteEnvelope')).to_have_count(0)
    page.get_by_role('button',name='Replay',exact=True).click()
    expect(page.locator('.inviteEnvelope')).to_be_visible()
    page.locator('.invitationWhatsappBtn').click()
    page.wait_for_url('**/login**')
    results.append({"case":"required fields, leap date, midnight, keyboard open, replay, checkout login","errors":[],"form":1})
    response={"status":200,"json":{"invitation":{"title":"A celebration","image":"","mood":"champagne","details":{"name":"<script>alert(1)</script>","language":"English","date":"2000-01-01","time":"00:00","venue":"Tunis & Sousse"}}}}
    context.route('**/api/invitations/**',lambda route:route.fulfill(**response))
    page.goto(BASE+'/invite/'+'b'*32)
    page.locator('.inviteEnvelope').click()
    expect(page.locator('.invitePersonalisedCover h2')).to_have_text('<script>alert(1)</script>')
    expect(page.locator('.inviteCountdown')).to_have_count(0)
    assert page.locator('.invitePersonalisedCover script').count()==0
    response={"status":404,"json":{"detail":"Invitation not found"}}
    page.reload()
    expect(page.get_by_role('alert')).to_contain_text('not available')
    results.append({"case":"blank artwork, escaped HTML, past event, unavailable guest link","errors":[],"form":1})
    browser.close()
out=Path(__file__).resolve().parents[3]/'artifacts/verification/invitation-edges.json'
out.write_text(json.dumps(results,indent=2),encoding='utf-8')
print(json.dumps(results,indent=2))
assert all(not row['errors'] and row['form'] for row in results)
