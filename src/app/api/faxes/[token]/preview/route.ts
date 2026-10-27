// GET /api/faxes/[token]/preview — lets the sender check the PDF before paying.
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const fax = await prisma.fax.findUnique({ where: { token: params.token }, select: { pdf: true, status: true } });
  if (!fax?.pdf || fax.status !== "DRAFT") return new Response("This preview is no longer available.", { status: 404 });
  return new Response(fax.pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="fax-preview.pdf"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
