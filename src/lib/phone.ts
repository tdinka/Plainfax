// US and Canada fax numbers only (the North American Numbering Plan).

const BLOCKED_AREA_CODES = new Set(["900", "976"]); // premium-rate lines

export type PhoneResult = { ok: true; e164: string } | { ok: false; error: string };

export function parseFaxNumber(input: string): PhoneResult {
  let digits = (input || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) {
    return { ok: false, error: "Enter a 10-digit US or Canada fax number, like (212) 555-0123." };
  }
  const area = digits.slice(0, 3);
  const exchange = digits.slice(3, 6);
  if (!/[2-9]/.test(area[0]) || !/[2-9]/.test(exchange[0])) {
    return { ok: false, error: "That doesn't look like a real US or Canada number. Check the area code." };
  }
  if (area[1] === "1" && area[2] === "1") {
    return { ok: false, error: "That's a service code (like 411), not a fax number." };
  }
  if (BLOCKED_AREA_CODES.has(area)) {
    return { ok: false, error: "Premium-rate numbers (900, 976) can't receive faxes here." };
  }
  return { ok: true, e164: `+1${digits}` };
}

export function formatFaxNumber(e164: string): string {
  const d = e164.replace(/\D/g, "").slice(-10);
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
