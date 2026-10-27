import { randomBytes, createHash } from "crypto";

/** An unguessable token for secret links. */
export function newToken(bytes = 18): string {
  return randomBytes(bytes).toString("base64url");
}

/** We never store raw IP addresses, only a salted hash, for the abuse limit. */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256").update(`${process.env.IP_SALT || "plainfax"}:${ip}`).digest("hex").slice(0, 32);
}
