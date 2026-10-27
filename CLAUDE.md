# Plainfax — notes for Claude Code

Pay-per-fax web app: upload → price → pay once → fax sent → delivery confirmation, with automatic refund on failure. Launch plan (scope, pricing, 90-day keep-or-stop rule): https://claude.ai/artifact/Fi5USTthvLab77g5fZg88q

## Decisions already made
- Web first (mobile-friendly). No native app yet.
- Everyone, pay-per-fax, no accounts, no subscription. No HIPAA claims until a healthcare edition is deliberately built (needs a fax vendor BAA).
- US and Canada numbers only. Sending only, no receiving.
- Prices live in `src/lib/config.ts` (`PRICE_TIERS`); the cover page is free and not counted.
- The uploaded document is deleted (pdf set to null) as soon as a fax is delivered or finally fails. Keep it that way.
- Unpaid uploads lose their document within 24 hours (`purgeAbandonedDrafts`, run hourly from `src/instrumentation-node.ts`); paying after that refunds automatically. The Privacy page promises this.
- Working name "Plainfax", set only in `APP_NAME`.

## Stack (same as Recipe Box)
- Next.js 14 (App Router, TypeScript) + Tailwind CSS. Fonts are self-hosted npm packages (@fontsource), not Google Fonts links.
- Postgres with Prisma 5. Use `prisma db push`, never `prisma migrate dev`.
- Stripe Checkout for payment (`src/lib/payments.ts`); simulated when `STRIPE_SECRET_KEY` is empty.
- Fax line behind one interface (`src/lib/fax/`): `mock` (default, simulated) or `telnyx`.
- Hosting: Railway.

## How a fax moves (src/lib/lifecycle.ts)
DRAFT → (paid) PAID → SENDING → DELIVERED, or → FAILED + refund.
- Every step is idempotent: Stripe webhook, the return page and simulated pay can all call `markPaidAndSend`; only the first one sends.
- Busy / no-answer failures retry once after a delay (`MAX_ATTEMPTS`); `catchUp()` on status checks picks up retries after a server restart.
- Webhooks: `/api/webhooks/stripe` (signature checked with `STRIPE_WEBHOOK_SECRET`) and `/api/webhooks/telnyx` (Ed25519 signature with `TELNYX_PUBLIC_KEY`).
- Mock line: numbers ending 0000 fail on purpose; others deliver after ~6 s.

## Working with Tsega
- She is early in her technical journey: explain every terminal command before running it, one step at a time, in plain words, and say clearly when she needs to do something herself (Stripe, Telnyx, Railway, GitHub Desktop).
- Git: she commits and pushes through GitHub Desktop. Don't run `git commit`/`git push` unless she asks; say what to look for in the diff.
- Back up `.env` before any file reorganizing.
- Double-check Railway variable names exactly.
- Next.js 14.2 trap: `useSearchParams` + `Suspense` + `force-dynamic` in a Server Component can stack-overflow; read `searchParams` props (as `/f/[token]` does) or `window.location.search`.
- `export const dynamic = "force-dynamic"` does nothing in Client Components.

## Before go-live
See the checklist in README.md (support email, terms/privacy review, name check, one real test fax).
