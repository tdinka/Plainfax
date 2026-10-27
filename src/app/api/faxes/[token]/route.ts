// GET /api/faxes/[token] — current status, polled by the status page.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { catchUp } from "@/lib/lifecycle";
import { toView } from "@/lib/view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const fax = await prisma.fax.findUnique({ where: { token: params.token } });
  if (!fax) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await catchUp(fax);
  const fresh = await prisma.fax.findUniqueOrThrow({ where: { id: fax.id } });
  return NextResponse.json(toView(fresh), { headers: { "Cache-Control": "no-store" } });
}
