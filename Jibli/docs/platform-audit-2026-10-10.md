# Platform audit — 10 October 2026

## Remediation status

The findings below describe the original audit baseline. The implementation now includes:

- Saved, editable and unpublishable guest invitations using existing D17 storage, with a restricted public response.
- Admin-authenticated AliExpress quotes; browser amounts remain estimates and pending requests appear in tracking.
- Persistent invitation drafts, saved moods and structured customization at checkout.
- Required name/title validation and certificate-specific preview/guest behavior.
- Open/copy delivery actions, order summaries and admin payment search/status filters.
- French/Arabic purchase-flow copy, Arabic account/product forms, RTL support and a native keyboard-accessible language selector.
- All reported lint errors and warnings resolved, route lazy loading, a separate Supabase bundle, deferred gallery images and CI checks.

Repeatable checks now include the publishing browser-to-API integration, guest privacy, unpublish behavior and forged-quote rejection. See [the publishing guide](invitation-publishing.md) for the workflow and deployment limits. Existing legal policy text has also been translated into Arabic without changing its terms.

Final local results: build and lint pass (zero lint warnings); 17 backend tests pass; 46 route/viewport checks and seven collection preview regressions pass; payment, publishing and French/Arabic draft browser suites pass against the production build served locally. Main JS entry is about 312 kB before gzip, with Supabase split into a separate 202 kB chunk. Arabic legal pages were additionally checked on mobile after their translation. CI has been configured but its remote GitHub run has not been executed in this session. No production deployment or real transaction was performed.

Scope: current local working tree at localhost:5173 and localhost:8000. This is not a certification of the deployed website. Payment and admin lifecycle browser tests use simulated auth and API responses. Backend unit tests use mocked database calls. Live Supabase connectivity was checked with zero-row selects; no customer records were retrieved or modified. No real payments, orders, emails or WhatsApp messages were sent.

## Results

| Check | Result | Evidence |
| --- | --- | --- |
| Production build | Pass | TypeScript and Vite complete; main JS bundle about 652 kB before gzip, with a chunk size warning. |
| Backend tests | Pass | 12 tests: cart calculations, payment ownership, admin requirement, reference validation/duplicates/leading zeros, retry behavior, rejection, delivery and unavailable-schema handling. |
| Simulated payment browser journey | Pass | Checkout → mismatch correction → saved reference → WhatsApp message link → admin confirmation → processing → customer delivery. |
| Public pages and guest protection | Pass after fixes | 46 route/viewport checks at 390 px and 1440 px; public pages render without uncaught errors or detected broken loaded images/overflow; five protected pages redirect guests to login. |
| Invitation interactions | Pass after fixes | Seven collections: time before date, date entry/clearing, live names, theme, envelope opening, countdown, calendar link and replay. |
| Local backend availability | Pass | /health returns 200. /payments, /admin/payments, /cart, /orders and /admin/orders return 401 without authentication. |
| Database connectivity | Pass | profiles, orders, cart_items, order_events and d17_orders accessible using zero-row selects. This does not verify all RLS policies or production configuration. |
| Whole-project lint | Fail | Six errors and two warnings; details below. |

## Bugs fixed during this audit

1. Entering a time without a date, or clearing a date while time remained, crashed the invitation component with `Invalid time value`. Calendar generation now checks that the date is valid before formatting a timed event.
2. Login/register navigation extended to 477 px on a 390 px screen. The authentication navigation now wraps on small screens.

Added a repeatable read-only browser regression script: `backend/tests/platform_browser_smoke.py`. Latest route results: `backend/tests/platform_browser_results.json`.

## Improvements in priority order

### 1. Publish the actual customer invitation

The application currently has interactive design previews, not saved public guest invitations. There is no `/invite/:token` route or invitation publishing store. Admin delivery currently accepts manually entered text/links.

Build an admin workflow to save structured invitation content, review the final artwork, publish an unguessable guest URL and deliver it through the existing WhatsApp action. Guest pages should contain no customer account or payment information. Include unpublish and edit controls. Complete this before selling the preview as an already supported hosted invitation service.

### 2. Distinguish AliExpress estimates from verified prices

`main.py:add_cart_items` accepts `selected_options` from the browser. `pricing.py:calculate_cart_total` uses its `usd_price`, and `main.py:submit_order` marks the resulting amount `price_confirmed` automatically. Recalculating the formula prevents a forged total but does not establish that the source USD price is correct. A customer can alter that source price.

Keep customer-entered prices as estimates until an admin verifies them, or calculate a quote from independently verified product/variant data. Do not treat an automatically calculated customer-entered amount as a verified final quote. Manual D17 checking verifies a transfer, not the real AliExpress product cost.

### 3. Save the selected invitation mood

`AnimatedInvitation` keeps the color mood only in component state. `PaymentButton` submits text decoded from the request URL, which does not include that mood. Refreshing the design page resets it, and the admin cannot see what the customer chose.

Lift this choice into the invitation draft and save design ID, mood, language and form fields together as structured order data. Persist drafts so a refresh does not erase customization. Restore the same values in the admin editor and guest page.

### 4. Make invitation forms specific to the product

Current forms allow checkout without names or event details; missing values become “Not decided.” The Others collection also uses invitation language such as “You are warmly invited” and event controls for achievement certificates.

Require the essential name/title and clearly label optional fields. Use certificate-specific fields and presentation for achievement designs. Validate event dates while allowing a deliberate “date to be confirmed” choice. Keep checkout available for incomplete requests only if this is an explicit business decision communicated to the customer.

### 5. Make completed deliveries clickable and easier to review

Delivery text is rendered as paragraphs, so a supplied invitation/subscription URL is not automatically a link. Add validated open/copy actions, distinguish a gift code from a URL or tracking number, and show a clear order summary before the transfer instruction. Add admin search and filters by payment status, phone and reference as order volume grows.

### 6. Improve language consistency and accessibility

Navbar translations exist, but invitation and D17 screens largely use English literals. Add French and Arabic versions for the complete purchase flow, correct RTL layouts, and translated dates. The language listbox currently uses clickable options without full listbox arrow-key navigation; either implement keyboard behavior or use a simpler native control.

### 7. Finish engineering checks and improve loading

Whole-project ESLint reports:

- `src/api.ts`: `preserve-caught-error`.
- `src/components/OrderItemCard.tsx`: two `set-state-in-effect` errors and two missing translation dependencies.
- `src/i18n/LanguageContext.tsx`: component-only export rule.
- `src/pages/AdminDashboard.tsx`: `set-state-in-effect`.
- `src/pages/Register.tsx`: `set-state-in-effect`.

These did not prevent the successful build, but should be resolved rather than disabled wholesale. Split routes with lazy loading to reduce the initial JS bundle; optimize invitation artwork for mobile delivery. Add CI for build, backend tests and browser regressions.

## Remaining verification limits

- Actual login, signup verification email and password reset were not exercised with a real user credential or inbox.
- No real authenticated customer/admin request was sent through the complete live API-to-database mutation path. Browser lifecycle and backend handler tests are separate simulated checks.
- Real AliExpress scraping, product availability, variant prices and overseas fulfillment were not verified.
- Production deployment, WhatsApp app handoff, calendar import on iOS/Android and real devices remain to be checked.
- Passing zero-row database queries does not establish database grants/RLS correctness for every role.

Recommended sequence: final invitation publishing → verified AliExpress pricing → persistent structured drafts → form validation and delivery actions → language/accessibility → performance and CI cleanup.
