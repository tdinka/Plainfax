// Stripe Checkout when keys are set; otherwise payments are simulated so the
// whole app can be tried without a Stripe account.
import Stripe from "stripe";
import { APP_NAME, appUrl, stripeEnabled } from "./config";
import { formatFaxNumber } from "./phone";

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  return client;
}

export async function createCheckout(fax: {
  token: string;
  toNumber: string;
  totalPages: number;
  priceCents: number;
  email: string | null;
}): Promise<{ url: string; sessionId: string }> {
  if (!stripeEnabled()) throw new Error("Stripe is not configured");
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: fax.priceCents,
          product_data: {
            name: `Fax to ${formatFaxNumber(fax.toNumber)}`,
            description: `${fax.totalPages} page${fax.totalPages === 1 ? "" : "s"}, one-time. Refunded automatically if it can't be delivered.`,
          },
        },
      },
    ],
    customer_email: fax.email || undefined,
    metadata: { faxToken: fax.token, app: APP_NAME },
    payment_intent_data: { metadata: { faxToken: fax.token } },
    success_url: `${appUrl()}/f/${fax.token}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/f/${fax.token}`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout link");
  return { url: session.url, sessionId: session.id };
}

/** Returns the payment id if the checkout session is paid, else null. */
export async function paidSession(sessionId: string): Promise<{ token: string; paymentIntent: string | null } | null> {
  if (!stripeEnabled()) return null;
  const s = await stripe().checkout.sessions.retrieve(sessionId);
  if (s.payment_status !== "paid" || !s.metadata?.faxToken) return null;
  const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id ?? null;
  return { token: s.metadata.faxToken, paymentIntent: pi };
}

export async function refundPayment(paymentIntent: string): Promise<string> {
  const r = await stripe().refunds.create({ payment_intent: paymentIntent, reason: "requested_by_customer" });
  return r.id;
}
