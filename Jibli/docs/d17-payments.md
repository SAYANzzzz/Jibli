# D17 payment setup

Recipient: **92001397**. Payments are verified manually by Jibli; a submitted authorization number is never automatic proof of payment.

## Activate

1. Run `supabase/d17_payments.sql` in the **Jibli** project's SQL editor. It creates a restricted payment table and a service-role-only function for atomic AliExpress status updates. Do not run this in an unrelated Supabase project.
2. Deploy the updated FastAPI backend and frontend. No D17 API or WhatsApp Business API credentials are required for the manual flow.
3. Keep the Supabase service key on the backend only. The existing backend authenticates customers and checks the stored admin role for review endpoints.

## Customer

Choose an invitation or a priced gaming offer, then continue to D17 payment. Sign in, enter a WhatsApp number and load the server-confirmed amount **before transferring money**. Transfer to 92001397, enter and repeat the authorization number exactly, then submit. Tap **Send on WhatsApp** to send the saved reference and order details. The customer must tap send in WhatsApp; the website does not send messages silently.

AliExpress customers first submit their product request. After an admin requests payment with a final price, the payment button appears in order tracking. The backend uses the stored admin quote, not an amount supplied by the browser. Offers without a price stay on the WhatsApp enquiry flow.

## Admin

The D17 section in `/admin` shows the amount, recipient instructions, reference, customer phone and order details. Check the actual transfer in your D17 history, then confirm or reject with a reason. Confirmed orders can enter processing and receive delivery content: gift code, invitation URL, subscription URL or AliExpress tracking details. Customer tracking displays status and delivery; **Send customer update on WhatsApp** opens a prepared message after saving the update.

References are numeric strings so leading zeros are preserved. Duplicate submitted references are blocked by a database unique constraint. No specific D17 reference length is assumed from the example screenshot. Rejections allow a corrected reference without instructing the customer to pay again.

The backend's `app/payment_catalog.json` is the authoritative digital price list. Update it whenever frontend catalog products, tiers or prices change. Invitations cost 10 TND, weddings 15 TND.

## Verify before production

Run `python -m unittest discover -s tests` from `backend`, then `npm run build` from `Jibli`. The unit tests use a simulated database and do not move money. After applying SQL, use a staging customer and admin to verify ownership restrictions, duplicate references, pending review, confirmation, delivery and linked AliExpress updates against the actual database. Do not mark a real payment confirmed just to test the flow.
