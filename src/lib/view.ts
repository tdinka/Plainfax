// What the status page is allowed to see about a fax (never the PDF itself).
import type { Fax } from "@prisma/client";
import { faxProviderName, formatPrice, stripeEnabled } from "./config";
import { describeFailure } from "./fax/types";
import { formatFaxNumber } from "./phone";

export type FaxView = {
  token: string;
  status: Fax["status"];
  to: string;
  pageCount: number;
  totalPages: number;
  hasCover: boolean;
  price: string;
  fileNames: string;
  attempts: number;
  retrying: boolean;
  failureMessage: string | null;
  refunded: boolean;
  createdAt: string;
  deliveredAt: string | null;
  paymentMode: "simulated" | "test" | "live";
  faxMode: "simulated" | "live";
};

export function toView(f: Fax): FaxView {
  return {
    token: f.token,
    status: f.status,
    to: formatFaxNumber(f.toNumber),
    pageCount: f.pageCount,
    totalPages: f.totalPages,
    hasCover: f.hasCover,
    price: formatPrice(f.priceCents),
    fileNames: f.fileNames,
    attempts: f.attempts,
    retrying: f.status === "SENDING" && !f.providerFaxId && Boolean(f.nextAttemptAt),
    failureMessage: f.failureReason ? describeFailure(f.failureReason) : null,
    refunded: Boolean(f.refundedAt),
    createdAt: f.createdAt.toISOString(),
    deliveredAt: f.deliveredAt?.toISOString() ?? null,
    ...modes(),
  };
}

export function modes(): { paymentMode: FaxView["paymentMode"]; faxMode: FaxView["faxMode"] } {
  const paymentMode = !stripeEnabled()
    ? "simulated"
    : /^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY || "") // rk_ = restricted key
      ? "live"
      : "test";
  return { paymentMode, faxMode: faxProviderName() === "telnyx" ? "live" : "simulated" };
}
