"""French switching, persistence, accents and date rendering regressions."""
from urllib.parse import unquote
from playwright.sync_api import sync_playwright,expect
with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    page=browser.new_page(viewport={"width":390,"height":844},reduced_motion='reduce')
    page.goto('http://localhost:5173/invitations/weddings')
    page.locator('.weddingDesignCard').first.click()
    page.locator('.invitationForm input[type=date]').fill('2028-02-29')
    page.locator('.inviteEnvelope').click()
    expect(page.locator('.inviteEnvelope')).to_have_count(0)
    expect(page.locator('.inviteDateDisplay')).to_contain_text('Tuesday')
    page.locator('.navMenuToggle').click()
    page.locator('.languageTrigger').click()
    page.locator('.languageOption').filter(has_text='Français').click()
    expect(page.locator('html')).to_have_attribute('lang','fr')
    expect(page.locator('.inviteDateDisplay')).to_contain_text('mardi')
    expect(page.locator('.animatedInviteToolbar')).to_contain_text('Aperçu de votre invitation')
    assert page.evaluate("localStorage.getItem('jibli_lang')")=='fr'
    page.reload();expect(page.locator('html')).to_have_attribute('lang','fr')
    for path in ['/','/gaming','/login','/register','/reset-password','/auth/callback','/invitations/weddings','/invitations/engagements','/invitations/birthdays','/invitations/openings','/invitations/graduations','/invitations/family','/invitations/others','/terms','/privacy','/refund']:
        page.goto('http://localhost:5173'+path);page.locator('h1').first.wait_for()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),path
        text=page.locator('body').inner_text()
        for bad in ['D?tails','Aper?u','l?invitation','r?gion','Pr?cisez','disponibilit?','R?initialiser','Ã©','Ã¨','�']:
            assert bad not in text,(path,bad)
        if path=='/gaming':
            expect(page.locator('.gamingBrowseBtn')).to_have_text('Découvrir le catalogue')
            page.locator('.gamingGameCard').first.click()
            href=unquote(page.locator('.gamingWhatsappQuote').get_attribute('href'))
            assert 'Bonjour Jibli' in href and 'région' in href
        if path=='/reset-password':
            expect(page.locator('h1')).to_have_text('Réinitialiser le mot de passe')
            expect(page.get_by_placeholder('Nouveau mot de passe',exact=True)).to_be_visible()
        if path.startswith('/invitations/'):
            page.locator('.weddingDesignCard').first.click()
            expect(page.locator('.animatedInviteToolbar')).to_contain_text('Aperçu de votre invitation')
            expect(page.locator('.inviteOpenHint')).to_contain_text('Ouvrir l’invitation')
    page.screenshot(path='artifacts/verification/french-invitations.png')
    browser.close()
print('French switching/persistence, reactive French dates, 16 routes, seven invitation previews and WhatsApp accents passed.')
