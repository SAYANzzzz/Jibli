"""Simulated auth regression checks; no real accounts, emails, or database writes."""
import base64
import json
import time
from urllib.parse import quote
from playwright.sync_api import sync_playwright, expect

user = {"id": "00000000-0000-4000-8000-000000000001", "email": "test@example.invalid", "aud": "authenticated", "role": "authenticated", "user_metadata": {"full_name": "Test User"}}
encode = lambda value: base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip("=")
token = f"{encode({'alg':'HS256','typ':'JWT'})}.{encode({'sub':user['id'],'exp':int(time.time())+3600,'aud':'authenticated'})}.test"
session = {"access_token": token, "refresh_token": "test-only", "token_type": "bearer", "expires_in": 3600, "user": user}
profile_writes = []
def respond(route):
    url = route.request.url
    if '/auth/v1/token' in url: route.fulfill(json=session)
    elif '/auth/v1/user' in url:
        if route.request.method == 'PUT': route.fulfill(status=400,json={"msg":"Expired recovery session"})
        else: route.fulfill(json=user)
    elif '/rest/v1/profiles' in url:
        if route.request.method == 'POST':
            profile_writes.append(route.request.post_data_json)
            assert 'resolution=ignore-duplicates' in route.request.headers.get('prefer','')
        route.fulfill(json=[])
    else: route.fulfill(json={"id":user['id'],"role":"user"})

with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    context=browser.new_context(viewport={"width":390,"height":844})
    for pattern in ['**/auth/v1/**','**/rest/v1/**','**/api/**']: context.route(pattern,respond)
    page=context.new_page()
    page.goto('http://localhost:5173/register?next='+quote('//evil.invalid',safe=''))
    assert '/request' in page.locator('a[href^="/login?next="]').first.get_attribute('href').replace('%2F','/')
    page.goto('http://localhost:5173/login?next='+quote('/gaming?from=checkout',safe=''))
    paths=page.evaluate("""async () => {
      const {safeNextPath}=await import('/src/auth.ts');
      return ['/gaming?from=checkout','https://evil.invalid','//evil.invalid','/' + String.fromCharCode(92) + 'evil.invalid','javascript:alert(1)'].map(v=>safeNextPath(v));
    }""")
    assert paths==['/gaming?from=checkout','/','/','/','/'],paths
    page.locator('input[name=email]').fill(user['email'])
    page.locator('input[name=password]').fill('Password123!')
    page.locator('form button[type=submit]').click()
    page.wait_for_url('**/gaming?from=checkout')
    assert profile_writes and all('role' not in row for row in profile_writes)
    page.goto('http://localhost:5173/auth/callback?next='+quote('/gaming?oauth=done',safe=''))
    page.wait_for_url('**/gaming?oauth=done')
    page.goto('http://localhost:5173/auth/callback#error=access_denied&error_description=Provider%20declined')
    expect(page.locator('.authError')).to_have_text('Provider declined')
    page.goto('http://localhost:5173/reset-password')
    page.locator('[name=password]').fill('NewPassword123!')
    page.locator('[name=confirmPassword]').fill('Mismatch123!')
    page.locator('form button[type=submit]').click()
    expect(page.locator('.authError')).to_have_text('Passwords do not match.')
    page.locator('[name=confirmPassword]').fill('NewPassword123!')
    page.locator('form button[type=submit]').click()
    expect(page.locator('.authError')).to_be_visible()
    expect(page.locator('form button[type=submit]')).to_be_enabled()
    browser.close()
print('Passed safe return URLs, login and OAuth continuation, profile preservation, callback errors, and password reset validation/error recovery.')
