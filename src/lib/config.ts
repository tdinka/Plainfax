// One place for the app's name and prices, so renaming or repricing is a one-line change.

export const APP_NAME = "Fax Just Once";
export const SUPPORT_EMAIL = "plainfax.help@gmail.com";

export const MAX_DOC_PAGES = 50;
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB total
export const MAX_ATTEMPTS = 2; // first try + one automatic retry
export const DRAFTS_PER_HOUR_PER_VISITOR = 20;
// Unpaid uploads lose their document after this long. The cleanup runs hourly,
// so nothing unpaid is kept past 24 hours (the Privacy page promises that).
export const UNPAID_DOCUMENT_LIFETIME_MS = 23 * 60 * 60 * 1000;

// Price tiers by document pages (the cover page is free).
export const PRICE_TIERS = [
  { upTo: 10, cents: 299 },
  { upTo: 25, cents: 499 },
  { upTo: 50, cents: 799 },
] as const;

export function priceForPages(pages: number): number {
  const tier = PRICE_TIERS.find((t) => pages <= t.upTo);
  if (!tier) throw new Error(`Faxes are limited to ${MAX_DOC_PAGES} pages.`);
  return tier.cents;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function appUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

/** True when real Stripe keys are set. Otherwise payments are simulated. */
export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function faxProviderName(): "mock" | "telnyx" {
  return process.env.FAX_PROVIDER === "telnyx" ? "telnyx" : "mock";
}
