// Emails to the address people give on the form (it's optional): the status link
// once paid, then the delivery confirmation, or a note that the fax failed and
// was refunded. Sent through Resend (https://resend.com) when RESEND_API_KEY and
// EMAIL_FROM are set; otherwise the email is only written to the server log.
// An email that can't be sent never holds up the fax itself.
import type { Fax } from "@prisma/client";
import { APP_NAME, SUPPORT_EMAIL, appUrl, formatPrice } from "./config";
import { prisma } from "./db";
import { formatFaxNumber } from "./phone";
import { receiptFileName, receiptPdf } from "./receipt";

type Attachment = { filename: string; content: Uint8Array };

async function send(fax: Fax, kind: string, subject: string, lines: string[], attachments: Attachment[] = []) {
  if (!fax.email) return;
  const text = [...lines, "", `${APP_NAME}. Questions? Reply to this email or write to ${SUPPORT_EMAIL}.`].join("\n");
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  try {
    if (!key || !from) {
      console.log(`[email not sent: RESEND_API_KEY or EMAIL_FROM missing] ${kind} — ${subject}\n${text}`);
      return;
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [fax.email],
        reply_to: SUPPORT_EMAIL,
        subject,
        text,
        attachments: attachments.map((a) => ({ filename: a.filename, content: Buffer.from(a.content).toString("base64") })),
      }),
    });
    if (!res.ok) throw new Error(`Resend refused the email (HTTP ${res.status}): ${(await res.text()).slice(0, 300)}`);
    await prisma.faxEvent.create({ data: { faxId: fax.id, type: "email", detail: kind } });
  } catch (err) {
    console.error(`email ${kind} failed`, err);
    await prisma.faxEvent
      .create({ data: { faxId: fax.id, type: "email_error", detail: `${kind}: ${err instanceof Error ? err.message : String(err)}`.slice(0, 1000) } })
      .catch(() => {});
  }
}

function statusUrl(fax: Fax): string {
  return `${appUrl()}/f/${fax.token}`;
}

function pages(n: number): string {
  return `${n} page${n === 1 ? "" : "s"}`;
}

/** Right after payment: the link back to the status page. */
export async function emailSending(fax: Fax) {
  const to = formatFaxNumber(fax.toNumber);
  await send(fax, "sending", `Your fax to ${to} is on its way`, [
    `We're sending your fax to ${to} now (${pages(fax.totalPages)}).`,
    "",
    "Check its status any time:",
    statusUrl(fax),
    "",
    "We'll email you again when it's delivered, with your delivery confirmation attached.",
  ]);
}

export async function emailDelivered(fax: Fax) {
  if (!fax.deliveredAt) return;
  const to = formatFaxNumber(fax.toNumber);
  const when = fax.deliveredAt.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "America/New_York" });
  const pdf = await receiptPdf({ ...fax, deliveredAt: fax.deliveredAt });
  await send(
    fax,
    "delivered",
    `Delivered: your fax to ${to}`,
    [
      `Your fax to ${to} was delivered on ${when} Eastern time (${pages(fax.totalPages)}).`,
      "",
      "Your delivery confirmation is attached. Keep it as proof you sent the fax.",
      "We've deleted your document from our servers.",
      "",
      "Status page:",
      statusUrl(fax),
    ],
    [{ filename: receiptFileName(fax.deliveredAt), content: pdf }],
  );
}

/** After the final attempt fails (or payment came after the document was deleted). */
export async function emailFailed(fax: Fax) {
  const to = formatFaxNumber(fax.toNumber);
  const why =
    fax.failureReason === "expired"
      ? "You paid more than 24 hours after uploading, and by then your document had already been deleted, so we couldn't send it."
      : `We couldn't deliver your fax to ${to}${fax.attempts > 1 ? `, even after trying again` : ""}. Check the number with the person you're sending to.`;
  const money = fax.refundedAt
    ? `We've refunded the full ${formatPrice(fax.priceCents)} to your card. It usually shows up within 5 to 10 business days.`
    : `We're refunding the full ${formatPrice(fax.priceCents)} to your card.`;
  const subject = `Your fax to ${to} couldn't be delivered. ${fax.refundedAt ? "You've been refunded" : "We're refunding you"}`;
  await send(fax, "failed", subject, [
    why,
    "",
    money,
    "Your document has been deleted from our servers.",
    "",
    "Status page:",
    statusUrl(fax),
  ]);
}
