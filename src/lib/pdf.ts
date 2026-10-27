// Builds the one PDF that gets faxed: optional cover page + every uploaded file.
// Also makes the delivery confirmation PDF people can download afterwards.
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

const LETTER: [number, number] = [612, 792]; // 8.5 x 11 in, in points
const MARGIN = 36;

export type UploadedFile = { name: string; type: string; bytes: Uint8Array };

export type CoverDetails = {
  toName?: string;
  fromName?: string;
  fromContact?: string; // phone or email for replies
  subject?: string;
  message?: string;
};

export class UserFacingError extends Error {}

/**
 * The fax cover page uses the built-in Helvetica font, which only covers
 * Western European letters. Swap curly quotes and dashes for plain ones and
 * replace anything else it can't draw with "?", so a stray emoji never crashes a send.
 */
export function toFaxSafeText(input: string | undefined, max = 2000): string {
  if (!input) return "";
  return input
    .slice(0, max)
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/…/g, "...")
    .replace(/ /g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[^\n\x20-\x7E\u00A1-\u00FF]/gu, "?"); // one "?" per emoji or non-Latin letter
}

function kind(file: UploadedFile): "pdf" | "jpg" | "png" | "heic" | "other" {
  const n = file.name.toLowerCase();
  const t = file.type.toLowerCase();
  if (t === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (t === "image/jpeg" || /\.jpe?g$/.test(n)) return "jpg";
  if (t === "image/png" || n.endsWith(".png")) return "png";
  if (t.includes("heic") || t.includes("heif") || /\.hei[cf]$/.test(n)) return "heic";
  return "other";
}

/** Sniff the first bytes so a renamed file can't sneak through. */
function looksLike(bytes: Uint8Array, k: "pdf" | "jpg" | "png"): boolean {
  if (k === "pdf") return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
  if (k === "jpg") return bytes[0] === 0xff && bytes[1] === 0xd8;
  return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47; // .PNG
}

export async function buildDocument(files: UploadedFile[]): Promise<{ doc: PDFDocument; pageCount: number }> {
  if (!files.length) throw new UserFacingError("Add at least one file to fax.");
  const out = await PDFDocument.create();

  for (const file of files) {
    const k = kind(file);
    if (k === "heic") {
      throw new UserFacingError(
        `${file.name} is an iPhone HEIC photo. Choose it from your Photos library instead of Files (iPhone converts it to JPG), or save it as JPG first.`,
      );
    }
    if (k === "other") {
      throw new UserFacingError(`${file.name} isn't a PDF, JPG or PNG. Those are the formats we can fax.`);
    }
    if (!looksLike(file.bytes, k)) {
      throw new UserFacingError(`${file.name} looks damaged or isn't really a ${k.toUpperCase()} file.`);
    }

    if (k === "pdf") {
      let src: PDFDocument;
      try {
        src = await PDFDocument.load(file.bytes);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (/encrypt/i.test(msg)) {
          throw new UserFacingError(`${file.name} is password-protected. Remove the password and upload it again.`);
        }
        throw new UserFacingError(`We couldn't read ${file.name}. Try saving it as a new PDF and uploading again.`);
      }
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p) => out.addPage(p));
    } else {
      const img = k === "jpg" ? await out.embedJpg(file.bytes) : await out.embedPng(file.bytes);
      const page = out.addPage(LETTER);
      // Wide photos go on a landscape page so they print bigger.
      if (img.width > img.height) page.setSize(LETTER[1], LETTER[0]);
      const { width: pw, height: ph } = page.getSize();
      // Fit inside the margins, scaling small images up and large ones down.
      const scale = Math.min((pw - MARGIN * 2) / img.width, (ph - MARGIN * 2) / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
    }
  }

  return { doc: out, pageCount: out.getPageCount() };
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= width) {
        line = next;
      } else {
        if (line) lines.push(line);
        // A single word longer than the line gets hard-broken.
        let rest = word;
        while (font.widthOfTextAtSize(rest, size) > width) {
          let cut = rest.length - 1;
          while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > width) cut--;
          lines.push(rest.slice(0, cut));
          rest = rest.slice(cut);
        }
        line = rest;
      }
    }
    lines.push(line);
  }
  return lines;
}

function field(page: PDFPage, label: string, value: string, y: number, fonts: { bold: PDFFont; reg: PDFFont }) {
  page.drawText(label.toUpperCase(), { x: 72, y, size: 9, font: fonts.bold, color: rgb(0.35, 0.35, 0.35) });
  page.drawText(value || "-", { x: 180, y, size: 13, font: fonts.reg });
  page.drawLine({ start: { x: 72, y: y - 8 }, end: { x: 540, y: y - 8 }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
}

export async function addCoverPage(
  doc: PDFDocument,
  cover: CoverDetails,
  info: { toNumber: string; totalPages: number; date: Date },
) {
  const page = doc.insertPage(0, LETTER);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const fonts = { bold, reg };

  page.drawText("FAX", { x: 72, y: 690, size: 48, font: bold });
  page.drawRectangle({ x: 72, y: 676, width: 468, height: 3, color: rgb(0, 0, 0) });

  let y = 630;
  const rows: [string, string][] = [
    ["To", toFaxSafeText(cover.toName, 80)],
    ["Fax number", info.toNumber],
    ["From", toFaxSafeText(cover.fromName, 80)],
    ["Reply to", toFaxSafeText(cover.fromContact, 80)],
    ["Date", info.date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
    ["Pages", `${info.totalPages} (including this cover page)`],
    ["Subject", toFaxSafeText(cover.subject, 90)],
  ];
  for (const [label, value] of rows) {
    field(page, label, value, y, fonts);
    y -= 34;
  }

  const message = toFaxSafeText(cover.message, 1500);
  if (message) {
    y -= 10;
    page.drawText("MESSAGE", { x: 72, y, size: 9, font: bold, color: rgb(0.35, 0.35, 0.35) });
    y -= 20;
    for (const line of wrap(message, reg, 12, 468).slice(0, 22)) {
      page.drawText(line, { x: 72, y, size: 12, font: reg });
      y -= 16;
    }
  }

  page.drawText(
    "This fax may contain confidential information. If you received it by mistake, please notify the sender and destroy it.",
    { x: 72, y: 60, size: 8, font: reg, color: rgb(0.4, 0.4, 0.4), maxWidth: 468 },
  );
}

export async function buildReceipt(r: {
  appName: string;
  reference: string;
  toNumber: string;
  totalPages: number;
  sentAt: Date | null;
  deliveredAt: Date;
  fileNames: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage(LETTER);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const fmt = (d: Date) =>
    d.toLocaleString("en-US", { dateStyle: "long", timeStyle: "long", timeZone: "America/New_York" });

  page.drawText(`${toFaxSafeText(r.appName)} - Fax delivery confirmation`, { x: 72, y: 700, size: 18, font: bold });
  page.drawRectangle({ x: 72, y: 688, width: 468, height: 2, color: rgb(0.04, 0.48, 0.32) });
  let y = 650;
  const rows: [string, string][] = [
    ["Result", "Delivered"],
    ["Sent to", r.toNumber],
    ["Pages delivered", String(r.totalPages)],
    ["Started", r.sentAt ? fmt(r.sentAt) : "-"],
    ["Delivered", fmt(r.deliveredAt)],
    ["Documents", toFaxSafeText(r.fileNames, 200)],
    ["Reference", r.reference],
  ];
  for (const [label, value] of rows) {
    page.drawText(label.toUpperCase(), { x: 72, y, size: 9, font: bold, color: rgb(0.35, 0.35, 0.35) });
    const lines = wrap(value, reg, 12, 340);
    lines.forEach((line, i) => page.drawText(line, { x: 200, y: y - i * 15, size: 12, font: reg }));
    y -= 30 + (lines.length - 1) * 15;
  }
  page.drawText(
    "Times are shown in US Eastern time. Keep this page as proof that your fax was delivered. For your privacy, we deleted the document from our servers after delivery.",
    { x: 72, y: y - 20, size: 10, font: reg, color: rgb(0.3, 0.3, 0.3), maxWidth: 468, lineHeight: 14 },
  );
  return doc.save();
}
