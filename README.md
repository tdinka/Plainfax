# Fax Just Once

Send a fax online for $2.99, no subscription. Upload a PDF or photos, enter a US or Canada fax number, pay once, and watch it get delivered. If the fax can't be delivered, the payment is refunded automatically.

The name is set in one place: `src/lib/config.ts` (`APP_NAME`). Live at https://faxjustonce.com. (The repo, folder and Railway service are still called "plainfax"; that's fine.)

## What's built

- Upload PDFs, JPGs and PNGs (up to 50 pages, 20 MB). Photos become fax pages.
- Optional free cover page.
- Exact page count and price shown before paying, plus a preview of the PDF that will be sent.
- Payment through Stripe Checkout, or simulated payment when no Stripe keys are set.
- Sending through Telnyx, or a simulated fax line when `FAX_PROVIDER` is `mock`.
- Live status page with automatic redial for busy or unanswered lines.
- Automatic refund when a fax finally fails.
- Delivery confirmation PDF.
- The document is deleted from the database once the fax is delivered or fails.

## Run it on your computer (test mode, costs nothing)

You need Node.js and a Postgres database. Use a practice database on your own computer, never the live one: `brew install postgresql@16`, `brew services start postgresql@16`, `/opt/homebrew/opt/postgresql@16/bin/createdb faxjustonce_dev`, then set `DATABASE_URL="postgresql://<your Mac username>@localhost:5432/faxjustonce_dev"`.

1. Open Terminal in this folder and install the packages:
   ```bash
   npm install
   ```
2. Copy the example settings file and fill in `DATABASE_URL`:
   ```bash
   cp .env.example .env
   ```
   Leave the Stripe and Telnyx lines empty for now. That keeps everything simulated.
3. Create the database tables:
   ```bash
   npm run db:push
   ```
4. Start the app and open http://localhost:3000:
   ```bash
   npm run dev
   ```

### Trying it in test mode

- Any fax number works. The simulated line "delivers" after about 6 seconds.
- A number ending in **0000**, like (212) 555-0000, fails on purpose. You'll see the automatic redial, then the failure and the refund.
- A yellow "Test mode" note appears on the status page until both Stripe live keys and Telnyx are switched on.

## Going live (Phase 2 and 3 of the launch plan)

### Stripe (payments)
1. Create a Stripe account and copy the **test** secret key (`sk_test_...`) into `STRIPE_SECRET_KEY`.
2. In Stripe, go to Developers, then Webhooks, and add an endpoint:
   `https://YOUR-DOMAIN/api/webhooks/stripe`, listening for `checkout.session.completed`.
3. Copy that endpoint's signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.
4. Test with card 4242 4242 4242 4242. Switch to live keys (`sk_live_...`) only when ready.

### Telnyx (sending real faxes)
1. Create a Telnyx account and buy one phone number (about $1 a month).
2. Create a **Fax Application**. Set its webhook URL to `https://YOUR-DOMAIN/api/webhooks/telnyx` and attach your number to it.
3. Fill in `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID` (the Fax Application's ID), `TELNYX_FROM_NUMBER` (like `+12125550123`) and `TELNYX_PUBLIC_KEY` (Account settings, Public key).
4. Set `FAX_PROVIDER="telnyx"`.

Real faxes need the app on a public web address, because Telnyx downloads the PDF from `APP_URL`. Test real sending on Railway, not on localhost.

### Railway
Same as Recipe Box: push to GitHub, create a Railway service from the repo, add a Postgres database, copy every line from `.env.example` into the service's variables (with real values), click Apply changes, then run `npm run db:push` once against that database.

## Before go-live checklist

- [x] Replace `SUPPORT_EMAIL` in `src/lib/config.ts` with a real inbox
- [ ] Have the Terms and Privacy pages reviewed (`src/app/terms`, `src/app/privacy`)
- [ ] Check the name and domain are free to use
- [ ] Send one real fax to a fax number you control and check the confirmation PDF

## Where to look when something goes wrong

Every fax has a log in the `FaxEvent` table (open it with `npm run db:studio`). A `refund_error` entry means an automatic refund didn't go through: refund that payment by hand in Stripe.

## Known limits

- The cover page font only supports Western European letters. Amharic or emoji on the cover show as "?". The uploaded documents themselves are unaffected.
- iPhone HEIC photos chosen from the Files app are rejected with instructions. Photos chosen from the Photos library arrive as JPG automatically.
