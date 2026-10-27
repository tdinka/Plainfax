// Everything that moves a fax from "paid" to "delivered" or "failed + refunded".
// Each step is safe to run twice (webhooks and page reloads can repeat), so a
// fax is never sent or refunded twice.
import type { Fax } from "@prisma/client";
import { prisma } from "./db";
import { MAX_ATTEMPTS, UNPAID_DOCUMENT_LIFETIME_MS, appUrl, faxProviderName, stripeEnabled } from "./config";
import { getProvider } from "./fax";
import { mockOutcome } from "./fax/mock";
import { RETRYABLE_REASONS } from "./fax/types";
import { refundPayment } from "./payments";

const RETRY_DELAY_MS = faxProviderName() === "mock" ? 3000 : 2 * 60 * 1000; // wait before redialing a busy line

export async function logEvent(faxId: string, type: string, detail?: string) {
  await prisma.faxEvent.create({ data: { faxId, type, detail: detail?.slice(0, 1000) } });
}

/** Called once payment is confirmed (Stripe webhook, return page, or simulated pay). */
export async function markPaidAndSend(token: string, payment: { sessionId?: string; paymentIntent?: string | null }) {
  const claimed = await prisma.fax.updateMany({
    where: { token, status: "DRAFT" },
    data: {
      status: "PAID",
      paidAt: new Date(),
      stripeSessionId: payment.sessionId ?? undefined,
      stripePaymentIntent: payment.paymentIntent ?? undefined,
    },
  });
  if (claimed.count === 0) return; // already paid (this is a repeat notification)
  const fax = await prisma.fax.findUniqueOrThrow({ where: { token } });
  await logEvent(fax.id, "paid", payment.paymentIntent ? `payment ${payment.paymentIntent}` : "simulated payment");
  if (!fax.pdf) {
    // Paid after the unpaid document was cleaned up (checkout left open too long).
    await prisma.fax.update({ where: { id: fax.id }, data: { status: "FAILED", failedAt: new Date(), failureReason: "expired" } });
    await logEvent(fax.id, "failed", "expired");
    await refund(fax.id);
    return;
  }
  await dispatch(fax.id);
}

/** Deletes the document from uploads that were never paid for. Runs hourly (see instrumentation-node.ts). */
export async function purgeAbandonedDrafts(): Promise<number> {
  const { count } = await prisma.fax.updateMany({
    where: { status: "DRAFT", pdf: { not: null }, createdAt: { lt: new Date(Date.now() - UNPAID_DOCUMENT_LIFETIME_MS) } },
    data: { pdf: null },
  });
  return count;
}

/** Hands the PDF to the fax line for one attempt. */
export async function dispatch(faxId: string) {
  // Claim this attempt so two requests can't dial at the same time.
  const fax = await prisma.fax.findUnique({ where: { id: faxId } });
  if (!fax || !fax.pdf) return;
  const claimed = await prisma.fax.updateMany({
    where: {
      id: faxId,
      OR: [{ status: "PAID" }, { status: "SENDING", providerFaxId: null, nextAttemptAt: { lte: new Date() } }],
    },
    data: { status: "SENDING", nextAttemptAt: null, attempts: { increment: 1 }, sentAt: new Date() },
  });
  if (claimed.count === 0) return;

  const provider = getProvider();
  try {
    const { providerFaxId } = await provider.send({
      to: fax.toNumber,
      mediaUrl: `${appUrl()}/api/media/${fax.mediaToken}`,
    });
    await prisma.fax.update({ where: { id: faxId }, data: { providerFaxId, provider: provider.name } });
    await logEvent(faxId, "sending", `attempt ${fax.attempts + 1} via ${provider.name} (${providerFaxId})`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEvent(faxId, "send_error", msg);
    await handleFailure(faxId, "send_error");
  }
}

/** A delivery report from the fax line. Ignores reports about older attempts. */
export async function applyProviderResult(
  providerFaxId: string,
  result: { status: "delivered"; pageCount?: number } | { status: "failed"; reason: string },
) {
  const fax = await prisma.fax.findUnique({ where: { providerFaxId } });
  if (!fax || fax.status !== "SENDING") return;

  if (result.status === "delivered") {
    const done = await prisma.fax.updateMany({
      where: { id: fax.id, status: "SENDING", providerFaxId },
      data: { status: "DELIVERED", deliveredAt: new Date(), pdf: null, failureReason: null },
    });
    if (done.count) await logEvent(fax.id, "delivered", result.pageCount ? `${result.pageCount} pages` : undefined);
    return;
  }
  await logEvent(fax.id, "attempt_failed", result.reason);
  await handleFailure(fax.id, result.reason);
}

async function handleFailure(faxId: string, reason: string) {
  const fax = await prisma.fax.findUnique({ where: { id: faxId } });
  if (!fax || fax.status !== "SENDING") return;

  if (RETRYABLE_REASONS.has(reason) && fax.attempts < MAX_ATTEMPTS) {
    const nextAttemptAt = new Date(Date.now() + RETRY_DELAY_MS);
    await prisma.fax.update({
      where: { id: faxId },
      data: { providerFaxId: null, failureReason: reason, nextAttemptAt },
    });
    await logEvent(faxId, "retry_scheduled", `${reason}; retrying at ${nextAttemptAt.toISOString()}`);
    // Retry in the background; status-page checks also pick it up if the server restarted.
    setTimeout(() => void dispatch(faxId).catch(() => {}), RETRY_DELAY_MS + 250);
    return;
  }

  const failed = await prisma.fax.updateMany({
    where: { id: faxId, status: "SENDING" },
    data: { status: "FAILED", failedAt: new Date(), failureReason: reason, pdf: null, providerFaxId: null, nextAttemptAt: null },
  });
  if (failed.count) {
    await logEvent(faxId, "failed", reason);
    await refund(faxId);
  }
}

/** Refunds a failed fax. Simulated payments are "refunded" instantly. */
export async function refund(faxId: string) {
  const fax = await prisma.fax.findUnique({ where: { id: faxId } });
  if (!fax || fax.refundedAt || fax.status !== "FAILED") return;
  try {
    let refundId = "simulated";
    if (fax.stripePaymentIntent && stripeEnabled()) refundId = await refundPayment(fax.stripePaymentIntent);
    await prisma.fax.update({ where: { id: faxId }, data: { refundedAt: new Date(), refundId } });
    await logEvent(faxId, "refunded", refundId);
  } catch (err) {
    // Leave refundedAt empty so it shows up for a manual refund.
    await logEvent(faxId, "refund_error", err instanceof Error ? err.message : String(err));
  }
}

/**
 * Run whenever someone checks a fax's status: catches up retries that were
 * due (e.g. after a server restart) and moves simulated faxes along.
 */
export async function catchUp(fax: Fax): Promise<void> {
  if (fax.status !== "SENDING") return;
  if (!fax.providerFaxId && fax.nextAttemptAt && fax.nextAttemptAt <= new Date()) {
    await dispatch(fax.id);
    return;
  }
  if (fax.provider === "mock" && fax.providerFaxId && fax.sentAt) {
    const outcome = mockOutcome(fax.toNumber, fax.sentAt);
    if (outcome) {
      await applyProviderResult(
        fax.providerFaxId,
        outcome.status === "delivered" ? { status: "delivered", pageCount: fax.totalPages } : outcome,
      );
    }
  }
}
