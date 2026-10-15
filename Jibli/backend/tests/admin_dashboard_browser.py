"""Admin workflow regressions with synthetic accounts and intercepted API data."""
import base64
import json
import os
import time
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4

from dotenv import dotenv_values
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
BASE = os.getenv('PLATFORM_BASE_URL', 'http://127.0.0.1:5173')
project = urlparse(os.getenv('VITE_SUPABASE_URL') or dotenv_values(ROOT / '.env.local')['VITE_SUPABASE_URL']).hostname.split('.')[0]
user = {'id': str(uuid4()), 'email': 'admin@example.invalid', 'aud': 'authenticated', 'role': 'authenticated'}
encode = lambda value: base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip('=')
token = f"{encode({'alg': 'HS256'})}.{encode({'sub': user['id'], 'exp': int(time.time()) + 3600, 'aud': 'authenticated'})}.test"
session = {'access_token': token, 'refresh_token': 'test-only', 'token_type': 'bearer', 'expires_at': int(time.time()) + 3600, 'expires_in': 3600, 'user': user}
orders = [{'id': str(uuid4()), 'status': 'delivered' if i == 12 else 'ordered', 'final_price': 50, 'deposit_amount': 10, 'tracking_number': '', 'created_at': f'2026-10-{i+1:02d}T12:00:00Z', 'items': [], 'events': [], 'profiles': {'full_name': f'Customer {i:02d}', 'email': 'customer@example.invalid', 'phone': '92123456', 'city': 'Tunis'}} for i in range(13)]
payments = [{'id': str(uuid4()), 'title': f'Digital order {i}', 'kind': 'invitation' if i == 0 else 'gift_card', 'amount': 15, 'phone': '92123456', 'details': '', 'authorization': f'00000{i}', 'status': status, 'delivery': 'Saved delivery code' if status == 'processing' else '', 'review_note': '', 'created_at': '2026-10-10T12:00:00Z'} for i, status in enumerate(['pending_verification', 'processing', 'delivered'])]
requests = {'orders': 0, 'payments': 0}

def handle(route):
    path = urlparse(route.request.url).path
    if path == '/auth/v1/user': value = user
    elif '/rest/v1/profiles' in path: value = {'full_name': 'Test Admin', 'avatar_url': None}
    elif path == '/api/me/profile': value = {'id': user['id'], 'role': 'admin'}
    elif path == '/api/admin/orders':
        requests['orders'] += 1
        value = {'orders': orders}
    elif path == '/api/admin/payments':
        requests['payments'] += 1
        value = {'payments': payments}
    else:
        route.fulfill(status=404, content_type='application/json', body='{}')
        return
    route.fulfill(status=200, content_type='application/json', body=json.dumps(value))

with sync_playwright() as p:
    browser = p.chromium.launch(channel=None if os.getenv('CI') else 'msedge', headless=True)
    for width in [320, 390, 1440]:
        context = browser.new_context(viewport={'width': width, 'height': 900})
        context.add_init_script('localStorage.setItem(' + json.dumps('sb-' + project + '-auth-token') + ',' + json.dumps(json.dumps(session)) + '); localStorage.setItem("jibli_lang","en");')
        for pattern in ['**/api/**', '**/auth/v1/**', '**/rest/v1/**']: context.route(pattern, handle)
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE + '/admin')
        expect(page.get_by_role('heading', level=1)).to_have_text('Your business, at a glance.')
        managed = page.locator('#admin-managed')
        expect(managed.locator('.managedOrderRow')).to_have_count(10)
        managed.get_by_role('button', name='Show more orders').click()
        expect(managed.locator('.managedOrderRow')).to_have_count(13)
        managed.get_by_label('Order status', exact=True).select_option('delivered')
        expect(managed.locator('.managedOrderRow')).to_have_count(1)
        managed.get_by_label('Order status', exact=True).select_option('')
        managed.get_by_label('Sort by').select_option('oldest')
        expect(managed.locator('.managedOrderRow').first).to_contain_text('Customer 00')
        page.get_by_label('Find a product order').fill('Customer 11')
        expect(managed.locator('.managedOrderRow')).to_have_count(1)
        page.get_by_label('Find a product order').fill('')
        desk = page.locator('#d17-review')
        desk.get_by_role('button', name='To verify').click()
        expect(desk.locator('.d17Panel')).to_have_count(1)
        desk.get_by_role('button', name='Clear filters').click()
        desk.get_by_label('Order type', exact=True).select_option('gift_card')
        expect(desk.locator('.d17Panel')).to_have_count(2)
        expect(desk.locator('.d17Panel[data-status=processing] textarea').last).to_have_value('Saved delivery code')
        desk.get_by_label('Search orders', exact=True).fill('no-match')
        expect(desk.get_by_text('No payments match your filters.')).to_be_visible()
        desk.get_by_role('button', name='Clear filters').click()
        before = requests.copy()
        if page.get_by_role('button', name='Open menu').is_visible():
            page.get_by_role('button', name='Open menu').click()
        page.get_by_role('button', name='Refresh dashboard', exact=True).click()
        expect(desk.locator('.d17Panel')).to_have_count(3)
        page.wait_for_function('document.querySelector(".navbar button.outlineBtn")?.disabled === false')
        assert requests['orders'] > before['orders'] and requests['payments'] > before['payments']
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
        assert not errors, errors
        page.evaluate('scrollTo(0,0)')
        page.screenshot(path=str(ROOT.parent / f'artifacts/verification/admin-dashboard-{width}.png'))
        context.close()
    browser.close()
print('Passed dashboard filters, pagination, sorting, saved delivery, refresh and responsive layout at 320, 390 and 1440px.')
