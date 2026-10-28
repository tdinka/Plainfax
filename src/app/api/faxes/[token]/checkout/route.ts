// POST /api/faxes/[token]/checkout — start payment. With Stripe keys this
// returns a Stripe Checkout link; without them it simulates payment.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { faxProviderName, stripeEnabled } from "@/lib/config";
import { markPaidAndSend } from "@/lib/lifecycle";
import { createCheckout } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { token: string } }) {
  const fax = await prisma.fax.findUnique({ where: { token: params.token } });
  if (!fax) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (fax.status !== "DRAFT") return NextResponse.json({ url: `/f/${fax.token}` });
  if (!fax.pdf) {
    return NextResponse.json({ error: "This upload has expired (we delete unpaid documents after 24 hours). Please start a new fax." }, { status: 410 });
  }

  if (!stripeEnabled()) {
    // Simulated payment is only for trying the app. Never send real faxes for free.
    if (faxProviderName() === "telnyx" || (process.env.NODE_ENV === "production" && process.env.ALLOW_SIMULATED_PAYMENTS !== "1")) {
      return NextResponse.json({ error: "Payments aren't set up yet." }, { status: 503 });
    }
    await markPaidAndSend(fax.token, {});
    return NextResponse.json({ url: `/f/${fax.token}`, simulated: true });
  }
  try {
    const { url, sessionId } = await createCheckout(fax);
    await prisma.fax.update({ where: { id: fax.id }, data: { stripeSessionId: sessionId } });
    return NextResponse.json({ url });
  } catch (err) {
    console.error("checkout failed", err);
    return NextResponse.json({ error: "We couldn't start checkout. Please try again." }, { status: 500 });
  }
}
