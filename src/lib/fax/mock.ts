// Simulated fax line for building and testing. Costs nothing, sends nothing.
// Test numbers: anything ending in 0000 fails (busy, then gives up) so you can
// see the retry and automatic refund; everything else is delivered after ~6s.
import { randomUUID } from "crypto";
import type { FaxProvider } from "./types";

export const MOCK_DELIVERY_MS = 6000;

export const mockProvider: FaxProvider = {
  name: "mock",
  async send() {
    return { providerFaxId: `mock_${randomUUID()}` };
  },
};

/** What the simulated line reports for a fax that's been "sending" for a while. */
export function mockOutcome(toNumber: string, sentAt: Date, now = new Date()):
  | null
  | { status: "delivered" }
  | { status: "failed"; reason: string } {
  if (now.getTime() - sentAt.getTime() < MOCK_DELIVERY_MS) return null;
  if (toNumber.endsWith("0000")) return { status: "failed", reason: "user_busy" };
  return { status: "delivered" };
}
