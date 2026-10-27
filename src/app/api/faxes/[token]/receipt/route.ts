// GET /api/faxes/[token]/receipt — delivery confirmation PDF.
import { prisma } from "@/lib/db";
import { APP_NAME } from "@/lib/config";
import { buildReceipt } from "@/lib/pdf";
import { formatFaxNumber } from "@/lib/phone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const fax = await prisma.fax.findUnique({ where: { token: params.token } });
  if (!fax || fax.status !== "DELIVERED" || !fax.deliveredAt) {
    return new Response("A confirmation is available once the fax is delivered.", { status: 404 });
  }
  const pdf = await buildReceipt({
    appName: APP_NAME,
    reference: fax.id,
    toNumber: formatFaxNumber(fax.toNumber),
    totalPages: fax.totalPages,
    sentAt: fax.sentAt,
    deliveredAt: fax.deliveredAt,
    fileNames: fax.fileNames,
  });
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="fax-confirmation-${fax.deliveredAt.toISOString().slice(0, 10)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
