// POST /api/form-errors — the send form reports an error it caught itself,
// before anything was uploaded. Body: {"kind": "no_file"}. Kind only, nothing else.
import { NextResponse } from "next/server";
import { BROWSER_ERROR_KINDS, recordFormError, type FormErrorKind } from "@/lib/formErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const kind = body?.kind as FormErrorKind;
  if (!BROWSER_ERROR_KINDS.includes(kind)) return NextResponse.json({ ok: false }, { status: 400 });
  await recordFormError(kind);
  return NextResponse.json({ ok: true });
}
