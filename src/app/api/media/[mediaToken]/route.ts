// GET /api/media/[mediaToken] — the fax line downloads the PDF from here.
// Only works while the fax is being sent; the file is deleted afterwards.
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { mediaToken: string } }) {
  const fax = await prisma.fax.findUnique({ where: { mediaToken: params.mediaToken }, select: { pdf: true, status: true } });
  if (!fax?.pdf || fax.status !== "SENDING") return new Response("Not found", { status: 404 });
  return new Response(fax.pdf, {
    headers: { "Content-Type": "application/pdf", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
