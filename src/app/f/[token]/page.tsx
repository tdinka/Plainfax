import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { catchUp, markPaidAndSend } from "@/lib/lifecycle";
import { paidSession } from "@/lib/payments";
import { toView } from "@/lib/view";
import StatusView from "@/components/StatusView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your fax", robots: { index: false, follow: false } };

export default async function FaxPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { session_id?: string };
}) {
  let fax = await prisma.fax.findUnique({ where: { token: params.token } });
  if (!fax) notFound();

  // Coming back from Stripe: confirm payment right away instead of waiting for the webhook.
  let justPaid = false;
  if (searchParams.session_id && fax.status === "DRAFT") {
    try {
      const paid = await paidSession(searchParams.session_id);
      if (paid && paid.token === fax.token) {
        await markPaidAndSend(fax.token, { sessionId: searchParams.session_id, paymentIntent: paid.paymentIntent });
        justPaid = true;
      }
    } catch (err) {
      console.error("could not confirm checkout session", err);
    }
  }

  await catchUp(fax);
  fax = await prisma.fax.findUniqueOrThrow({ where: { id: fax.id } });
  return <StatusView initial={toView(fax)} justPaid={justPaid || Boolean(searchParams.session_id)} />;
}
