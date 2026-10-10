# Invitation publishing and delivery

No new table or migration is required. Structured invitation content is saved in the existing restricted `d17_orders.details` text column as JSON, alongside the original request. `delivery` stores the relative guest link. Existing text-only orders remain supported in the admin editor.

## Customer

1. Choose a design, enter the required name/title and optional event details, and choose a mood. Drafts are saved locally and survive a refresh.
2. Continue to D17. The request saves the design, mood and structured fields with the order. A receipt number never confirms a payment automatically.
3. Once the admin completes the invitation, receive its link on WhatsApp and forward it to guests. Guests do not need accounts.

## Admin

1. Verify the actual D17 transfer and confirm payment.
2. Expand **Edit & publish guest invitation** on the order.
3. Review names, date, venue, language and the public message. Add an HTTPS final-artwork URL if needed. The sample reference artwork is deliberately not used on the guest page by default: it can contain someone else's names. Leaving the URL empty uses the personalised web design.
4. Check the interactive preview, then **Save & publish**. The order receives an unguessable `/invite/<token>` link.
5. Finish processing and save delivery, keeping this invitation link. Use **Send customer update on WhatsApp**, then tap Send in WhatsApp.
6. Subsequent edits keep the same guest link. **Save & unpublish** immediately makes the guest endpoint return 404. Republish to restore it.

Certificates use achievement wording without event countdown, venue or calendar actions. Normal invitation guest pages include the envelope opening, personalised details, countdown, map link and a calendar download when a date is provided.

Only the public invitation fields are returned by the guest endpoint. Payment references, account IDs, private order requests, admin notes and the customer's payment phone are not returned. Anyone with the shared guest link can view the published invitation; it is not password protected. The API disables caching and search indexing on successful guest responses.

Deploy both the frontend and backend together. The existing backend service key remains server-only. Local preview is available at localhost:5173; actual public delivery links should be sent from the production site so the WhatsApp message uses the public origin.

## AliExpress price verification

Customer-entered USD amounts are estimates. New requests remain `new_request` with no final price until an admin verifies the quote. Pending requests are visible in tracking.

Saving an admin quote adds a server-authenticated signature to its order event. D17 checkout verifies that signature for this exact order, customer and amount. This also protects against legacy direct browser insert policies. The signature is hidden in customer tracking. Existing quotes created before this change must be saved again by an admin; rotating the backend service key also requires pending quotes to be reconfirmed. Do not verify a legacy price without checking it.

## Checks

From `backend`: run `python -m unittest discover -s tests -p 'test_*.py' -v`. With the frontend running, run `tests/platform_browser_smoke.py`, `tests/payment_browser_smoke.py` and `tests/invitation_browser_smoke.py` using Python. Browser scripts use Edge locally and Chromium in CI. The publishing browser script exercises the actual API handlers with an in-memory database; no real orders or payments are changed.

From `Jibli`: run `npm run lint` and `npm run build`. CI runs these checks on pushes and pull requests. Production credentials, email delivery, physical devices and real fulfillment still require a controlled production/staging check.
