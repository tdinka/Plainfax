// POST /api/webhooks/telnyx — Telnyx reports fax progress (delivered / failed).
import { NextResponse } from "next/server";
import { applyProviderResult } from "@/lib/lifecycle";
import { verifyTelnyxWebhook } from "@/lib/fax/telnyx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const raw = await req.text();
  const ok = verifyTelnyxWebhook(raw, req.headers.get("telnyx-signature-ed25519"), req.headers.get("telnyx-timestamp"));
  if (!ok) return NextResponse.json({ error: "Bad signature" }, { status: 401 });

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const event = body?.data ?? body; // Telnyx wraps events in { data: ... }
  const type: string = event?.event_type || "";
  const payload = event?.payload || {};
  const faxId: string | undefined = payload.fax_id;
  if (!faxId) return NextResponse.json({ ignored: true });

  if (type === "fax.delivered") {
    await applyProviderResult(faxId, { status: "delivered", pageCount: payload.page_count });
  } else if (type === "fax.failed") {
    await applyProviderResult(faxId, { status: "failed", reason: payload.failure_reason || "unknown" });
  }
  // fax.queued / fax.media.processed / fax.sending.started need no action.
  return NextResponse.json({ received: true });
}
