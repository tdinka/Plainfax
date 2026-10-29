// The delivery confirmation PDF for a delivered fax, used by the download link
// and attached to the "delivered" email.
import type { Fax } from "@prisma/client";
import { APP_NAME } from "./config";
import { buildReceipt } from "./pdf";
import { formatFaxNumber } from "./phone";

export function receiptFileName(deliveredAt: Date): string {
  return `fax-confirmation-${deliveredAt.toISOString().slice(0, 10)}.pdf`;
}

export async function receiptPdf(fax: Fax & { deliveredAt: Date }): Promise<Uint8Array> {
  return buildReceipt({
    appName: APP_NAME,
    reference: fax.id,
    toNumber: formatFaxNumber(fax.toNumber),
    totalPages: fax.totalPages,
    sentAt: fax.sentAt,
    deliveredAt: fax.deliveredAt,
    fileNames: fax.fileNames,
  });
}
