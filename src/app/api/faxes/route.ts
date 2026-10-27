// POST /api/faxes — upload files, build the fax PDF, and price it. Nothing is
// sent until it's paid for.
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { DRAFTS_PER_HOUR_PER_VISITOR, MAX_DOC_PAGES, MAX_UPLOAD_BYTES, priceForPages } from "@/lib/config";
import { parseFaxNumber, formatFaxNumber } from "@/lib/phone";
import { addCoverPage, buildDocument, UserFacingError, type UploadedFile } from "@/lib/pdf";
import { hashIp, newToken } from "@/lib/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const coverSchema = z.object({
  toName: z.string().max(80).optional(),
  fromName: z.string().max(80).optional(),
  fromContact: z.string().max(80).optional(),
  subject: z.string().max(90).optional(),
  message: z.string().max(1500).optional(),
});

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("We couldn't read that upload. Please try again.");
  }

  const phone = parseFaxNumber(String(form.get("to") || ""));
  if (!phone.ok) return fail(phone.error);

  const email = String(form.get("email") || "").trim();
  if (email && !z.string().email().safeParse(email).success) return fail("That email address doesn't look right.");

  const wantsCover = form.get("cover") === "1";
  let cover: z.infer<typeof coverSchema> = {};
  if (wantsCover) {
    const parsed = coverSchema.safeParse(JSON.parse(String(form.get("coverDetails") || "{}")));
    if (!parsed.success) return fail("Some cover page fields are too long.");
    cover = parsed.data;
  }

  const entries = form.getAll("files").filter((f): f is File => typeof f !== "string");
  if (!entries.length) return fail("Add at least one file to fax.");
  if (entries.length > 20) return fail("You can attach up to 20 files per fax.");
  const total = entries.reduce((n, f) => n + f.size, 0);
  if (total > MAX_UPLOAD_BYTES) return fail("Files are limited to 20 MB in total. Try a smaller scan or fewer photos.");

  // Simple abuse limit per visitor, without storing their IP address.
  const ipHash = hashIp(req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip"));
  if (ipHash) {
    const recent = await prisma.fax.count({ where: { ipHash, createdAt: { gte: new Date(Date.now() - 3600_000) } } });
    if (recent >= DRAFTS_PER_HOUR_PER_VISITOR) return fail("Too many faxes started in the last hour. Please wait a bit.", 429);
  }

  try {
    const files: UploadedFile[] = await Promise.all(
      entries.map(async (f) => ({ name: f.name || "file", type: f.type || "", bytes: new Uint8Array(await f.arrayBuffer()) })),
    );
    const { doc, pageCount } = await buildDocument(files);
    if (pageCount > MAX_DOC_PAGES) {
      throw new UserFacingError(`That's ${pageCount} pages. Faxes are limited to ${MAX_DOC_PAGES} pages, so split it into two.`);
    }
    const totalPages = pageCount + (wantsCover ? 1 : 0);
    if (wantsCover) await addCoverPage(doc, cover, { toNumber: formatFaxNumber(phone.e164), totalPages, date: new Date() });
    const pdf = await doc.save();

    const fax = await prisma.fax.create({
      data: {
        token: newToken(),
        mediaToken: newToken(24),
        toNumber: phone.e164,
        pageCount,
        totalPages,
        hasCover: wantsCover,
        priceCents: priceForPages(pageCount),
        fileNames: files.map((f) => f.name).join(", ").slice(0, 500),
        pdf: Buffer.from(pdf),
        email: email || null,
        ipHash,
      },
    });
    await prisma.faxEvent.create({ data: { faxId: fax.id, type: "created", detail: `${totalPages} pages` } });
    return NextResponse.json({ token: fax.token });
  } catch (err) {
    if (err instanceof UserFacingError) return fail(err.message);
    console.error("create fax failed", err);
    return fail("Something went wrong preparing your fax. Please try again.", 500);
  }
}
