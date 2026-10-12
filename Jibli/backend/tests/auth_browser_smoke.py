"""Authentication form checks with mocked auth responses; no accounts or emails."""
from playwright.sync_api import sync_playwright, expect

calls=[]
def auth_response(route):
    path=route.request.url.split('/auth/v1/')[-1].split('?')[0]
    calls.append(path)
    if path=='signup':
        route.fulfill(json={"user":{"id":"00000000-0000-4000-8000-000000000001","email":"test@example.invalid","identities":[{"id":"test"}]},"session":None})
    else:
        route.fulfill(status=400,json={"code":"otp_expired" if path=='verify' else "invalid_credentials","msg":"Invalid test credentials or expired code"})

with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    context=browser.new_context(viewport={"width":390,"height":844})
    context.route('**/auth/v1/**',auth_response)
    page=context.new_page()
    page.goto('http://localhost:5173/login')
    page.locator('form button[type=submit]').click()
    assert not calls
    page.locator('input[name=email]').fill('test@example.invalid')
    page.locator('input[name=password]').fill('WrongPassword123!')
    page.locator('form button[type=submit]').click()
    expect(page.locator('.authError')).to_be_visible()
    expect(page.locator('form button[type=submit]')).to_be_enabled()
    assert calls==['token'],calls
    page.goto('http://localhost:5173/register')
    for name,value in {'fullName':'Test Person','email':'test@example.invalid','phone':'92123456','password':'Password123!','confirmPassword':'Different123!'}.items():
        page.locator(f'input[name="{name}"]').fill(value)
    page.locator('form button[type=submit]').click()
    expect(page.locator('.authError')).to_be_visible()
    assert 'signup' not in calls
    page.locator('input[name=confirmPassword]').fill('Password123!')
    page.locator('form button[type=submit]').click()
    expect(page.locator('input[inputmode=numeric]')).to_be_visible()
    page.locator('input[inputmode=numeric]').fill('00000000')
    page.locator('form button[type=submit]').click()
    expect(page.locator('.authError')).to_be_visible()
    expect(page.locator('form button[type=submit]')).to_be_enabled()
    assert calls==['token','signup','verify'],calls
    browser.close()
print('Passed blank login, invalid credentials, password mismatch, signup code screen and expired code handling; all auth requests simulated.')
