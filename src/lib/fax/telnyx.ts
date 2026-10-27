// Real faxes through Telnyx Programmable Fax.
// Docs: https://developers.telnyx.com/docs/programmable-fax/send-a-fax-api
import { createPublicKey, verify } from "crypto";
import type { FaxProvider } from "./types";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set. Add it to your environment variables.`);
  return v;
}

export const telnyxProvider: FaxProvider = {
  name: "telnyx",
  async send({ to, mediaUrl }) {
    const res = await fetch("https://api.telnyx.com/v2/faxes", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${required("TELNYX_API_KEY")}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        connection_id: required("TELNYX_CONNECTION_ID"),
        media_url: mediaUrl,
        to,
        from: required("TELNYX_FROM_NUMBER"),
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.data?.id) {
      throw new Error(`Telnyx refused the fax (HTTP ${res.status}): ${JSON.stringify(body).slice(0, 300)}`);
    }
    return { providerFaxId: String(body.data.id) };
  },
};

/**
 * Checks a webhook really came from Telnyx (Ed25519 signature over
 * "timestamp|raw body"). The public key comes from the Telnyx portal.
 */
export function verifyTelnyxWebhook(rawBody: string, signature: string | null, timestamp: string | null): boolean {
  const key = process.env.TELNYX_PUBLIC_KEY;
  if (!key || !signature || !timestamp) return false;
  // Reject anything older than 5 minutes so old messages can't be replayed.
  const ageSec = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSec) || ageSec > 300) return false;
  try {
    const raw = Buffer.from(key, "base64");
    // Wrap the raw 32-byte key in the standard Ed25519 "SPKI" envelope Node expects.
    const der = Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), raw]);
    const publicKey = createPublicKey({ key: der, format: "der", type: "spki" });
    return verify(null, Buffer.from(`${timestamp}|${rawBody}`), publicKey, Buffer.from(signature, "base64"));
  } catch {
    return false;
  }
}
