// GET /api/faxes/[token]/receipt — delivery confirmation PDF.
import { prisma } from "@/lib/db";
import { receiptFileName, receiptPdf } from "@/lib/receipt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const fax = await prisma.fax.findUnique({ where: { token: params.token } });
  if (!fax || fax.status !== "DELIVERED" || !fax.deliveredAt) {
    return new Response("A confirmation is available once the fax is delivered.", { status: 404 });
  }
  const pdf = await receiptPdf({ ...fax, deliveredAt: fax.deliveredAt });
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${receiptFileName(fax.deliveredAt)}"`,
      "Cache-Control": "no-store",
    },
  });
}
