// POST /api/webhooks/stripe — Stripe tells us a checkout was paid.
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { markPaidAndSend } from "@/lib/lifecycle";
import { stripe } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, req.headers.get("stripe-signature") || "", secret);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const s = event.data.object as Stripe.Checkout.Session;
    if (s.payment_status === "paid" && s.metadata?.faxToken) {
      const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id ?? null;
      await markPaidAndSend(s.metadata.faxToken, { sessionId: s.id, paymentIntent: pi });
    }
  }
  return NextResponse.json({ received: true });
}
