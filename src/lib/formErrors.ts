// Which kinds of error the send form showed, for the stats page. Only the kind
// and the time are saved: never file names, numbers or emails.
import { prisma } from "@/lib/db";

export const FORM_ERROR_KINDS = {
  no_file: "No document added",
  number_incomplete: "Fax number too short",
  number_invalid: "Fax number not accepted",
  email_invalid: "Email address not valid",
  too_many_files: "More than 20 files",
  too_big: "Files over 20 MB",
  too_many_pages: "Over 50 pages",
  heic: "iPhone HEIC photo",
  wrong_type: "Not a PDF, JPG or PNG",
  damaged: "Damaged file",
  password_pdf: "Password-protected PDF",
  unreadable_pdf: "PDF couldn't be read",
  cover_too_long: "Cover page text too long",
  rate_limit: "Too many faxes in an hour",
  bad_upload: "Upload couldn't be read",
  server: "Something broke on our side",
  network: "Upload didn't reach us",
} as const;

export type FormErrorKind = keyof typeof FORM_ERROR_KINDS;

// Errors only the browser sees (the form stops before uploading), reported via /api/form-errors.
export const BROWSER_ERROR_KINDS: FormErrorKind[] = ["no_file", "number_incomplete", "network"];

// Never throws: counting an error must not get in the way of the visitor.
export async function recordFormError(kind: FormErrorKind): Promise<void> {
  try {
    await prisma.formError.create({ data: { kind } });
  } catch (err) {
    console.error("record form error failed", err);
  }
}
