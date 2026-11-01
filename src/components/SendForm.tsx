"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

// thumb: a preview of a photo, so people can check it before sending (PDFs have none).
type Picked = { id: string; file: File; thumb?: string };

function formatAsTyped(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  d = d.slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

// Counts an error the form caught before uploading (kind only), for the stats page.
function report(kind: "no_file" | "number_incomplete" | "network") {
  fetch("/api/form-errors", { method: "POST", body: JSON.stringify({ kind }), keepalive: true }).catch(() => {});
}

function size(bytes: number): string {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function SendForm() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const dropZone = useRef<HTMLDivElement>(null);
  const [files, setFiles] = useState<Picked[]>([]);
  const [dragging, setDragging] = useState(false);
  const [to, setTo] = useState("");
  const [email, setEmail] = useState("");
  const [cover, setCover] = useState(false);
  const [coverDetails, setCoverDetails] = useState({ toName: "", fromName: "", fromContact: "", subject: "", message: "" });
  const [error, setError] = useState<string | null>(null);
  const [needDoc, setNeedDoc] = useState(false);
  const [busy, setBusy] = useState(false);

  const add = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).map((file) => ({
      id: `${file.name}-${file.size}-${Math.random()}`,
      file,
      thumb: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    setFiles((cur) => [...cur, ...next].slice(0, 20));
    setError(null);
    setNeedDoc(false);
  };
  const remove = (id: string) =>
    setFiles((cur) => {
      const gone = cur.find((f) => f.id === id);
      if (gone?.thumb) URL.revokeObjectURL(gone.thumb);
      return cur.filter((f) => f.id !== id);
    });
  const moveUp = (i: number) =>
    setFiles((cur) => {
      if (i === 0) return cur;
      const copy = [...cur];
      [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
      return copy;
    });

  const digits = to.replace(/\D/g, "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) {
      // People often press the main button first, expecting it to ask for the
      // document, so open the file chooser instead of only showing an error.
      // (On iPhone and Android it also offers the camera and photo library.)
      // The reminder shows in the document box, which is scrolled into view.
      report("no_file");
      setError(null);
      setNeedDoc(true);
      dropZone.current?.scrollIntoView({ block: "center" });
      fileInput.current?.click();
      return;
    }
    if (digits.length !== 10) {
      report("number_incomplete");
      return setError("Enter the 10-digit fax number you're sending to.");
    }
    setBusy(true);
    setError(null);
    const form = new FormData();
    files.forEach((f) => form.append("files", f.file));
    form.append("to", to);
    form.append("email", email);
    // Ads link with ?ref=gads; saved with the fax so the stats page can count ad sales.
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) form.append("ref", ref);
    if (cover) {
      form.append("cover", "1");
      form.append("coverDetails", JSON.stringify(coverDetails));
    }
    try {
      const res = await fetch("/api/faxes", { method: "POST", body: form }).catch((err) => {
        // Never reached the server (connection dropped), so the server didn't count it.
        report("network");
        throw err;
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong. Please try again.");
      router.push(`/f/${body.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="sheet p-5 sm:p-6" noValidate>
      <p className="eyebrow">New fax</p>

      {/* 1. Document */}
      <div className="mt-4">
        <span className="label">Document</span>
        <div
          ref={dropZone}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            add(e.dataTransfer.files);
          }}
          className={`rounded-lg border-2 border-dashed px-4 py-6 text-center transition ${
            dragging ? "border-signal bg-signal-50" : needDoc ? "border-alert bg-alert-50" : "border-line bg-paper-50"
          }`}
        >
          {needDoc && (
            <p role="alert" className="mb-2 text-sm font-medium text-alert">
              First, add the document you want to fax.
            </p>
          )}
          <p className="hidden text-sm text-ink-soft sm:block">Drop a PDF or photos here, or</p>
          <p className="text-sm font-medium sm:hidden">Add your document</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn-quiet" onClick={() => fileInput.current?.click()}>
              Choose files
            </button>
            {/* Phones: one photo per page, so after the first it asks for the next one. */}
            <button type="button" className="btn-quiet sm:hidden" onClick={() => cameraInput.current?.click()}>
              {files.length ? "Add next page" : "Take a photo"}
            </button>
          </div>
          <p className="mt-3 text-xs text-ink-faint">PDF, JPG or PNG · up to 50 pages · 20 MB total</p>
          <input
            ref={fileInput}
            id="files"
            type="file"
            multiple
            accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              add(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={cameraInput}
            id="camera"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              add(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {files.length > 0 && (
          <>
            <ol className="mt-3 divide-y divide-line rounded-lg border border-line">
              {files.map((f, i) => (
                <li key={f.id} className="flex items-center gap-2 py-1.5 pl-2 pr-1 text-sm">
                  <span className="w-4 text-center font-mono text-xs text-ink-faint">{i + 1}</span>
                  {f.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element -- a local preview, not a hosted image
                    <img src={f.thumb} alt="" className="h-12 w-10 flex-none rounded border border-line bg-white object-cover" />
                  ) : (
                    <span aria-hidden className="flex h-12 w-10 flex-none items-center justify-center rounded border border-line bg-paper-50 font-mono text-[10px] text-ink-faint">
                      PDF
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{f.file.name}</span>
                    <span className="block font-mono text-xs text-ink-faint">{size(f.file.size)}</span>
                  </span>
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => moveUp(i)}
                      className="flex h-11 w-11 flex-none items-center justify-center rounded-md text-base text-ink-soft hover:bg-paper-50 hover:text-ink"
                      aria-label={`Move ${f.file.name} up`}
                    >
                      ↑
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(f.id)}
                    className="flex h-11 flex-none items-center rounded-md px-2 text-xs text-alert hover:bg-alert-50"
                    aria-label={`Remove ${f.file.name}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ol>
            {files.length > 1 && <p className="mt-1 text-xs text-ink-faint">Faxed in this order. Use ↑ to move a page up.</p>}
          </>
        )}
      </div>

      {/* 2. Number */}
      <div className="mt-5">
        <label htmlFor="to" className="label">
          Fax number to send to
        </label>
        <input
          id="to"
          inputMode="tel"
          autoComplete="off"
          placeholder="(212) 555-0123"
          className="field font-mono tracking-wide"
          value={to}
          onChange={(e) => setTo(formatAsTyped(e.target.value))}
        />
        <p className="mt-1 text-xs text-ink-faint">US and Canada numbers.</p>
      </div>

      {/* 3. Cover page */}
      <div className="mt-5 rounded-lg border border-line">
        <label className="flex cursor-pointer items-center gap-3 px-3 py-3 text-sm">
          <input id="cover" type="checkbox" checked={cover} onChange={(e) => setCover(e.target.checked)} className="h-4 w-4 accent-signal" />
          <span className="font-medium">Add a cover page</span>
          <span className="ml-auto text-xs text-ink-faint">free</span>
        </label>
        {cover && (
          <div className="grid gap-3 border-t border-line p-3 sm:grid-cols-2">
            {(
              [
                ["toName", "To (name or office)", "Dr. Lee's office"],
                ["fromName", "From (your name)", "Jordan Smith"],
                ["fromContact", "Reply to (phone or email)", "(555) 555-0199"],
                ["subject", "Subject", "Signed lease"],
              ] as const
            ).map(([key, label, ph]) => (
              <div key={key}>
                <label htmlFor={`cover-${key}`} className="label text-xs">
                  {label}
                </label>
                <input
                  id={`cover-${key}`}
                  className="field py-2 text-sm"
                  placeholder={ph}
                  maxLength={key === "subject" ? 90 : 80}
                  value={coverDetails[key]}
                  onChange={(e) => setCoverDetails({ ...coverDetails, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label htmlFor="cover-message" className="label text-xs">
                Message
              </label>
              <textarea
                id="cover-message"
                rows={3}
                maxLength={1500}
                className="field py-2 text-sm"
                placeholder="Please see the attached pages."
                value={coverDetails.message}
                onChange={(e) => setCoverDetails({ ...coverDetails, message: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Email */}
      <div className="mt-5">
        <label htmlFor="email" className="label">
          Email for updates <span className="font-normal text-ink-faint">(optional)</span>
        </label>
        <input id="email" type="email" autoComplete="email" className="field" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <p className="mt-1 text-xs text-ink-faint">We'll email your status link, your receipt, and the delivery confirmation. Nothing else.</p>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-alert-50 px-3 py-2 text-sm text-alert">
          {error}
        </p>
      )}

      <button type="submit" className="btn-send mt-5 w-full" disabled={busy}>
        {busy ? "Preparing your fax…" : "Review price and send"}
      </button>
      <p className="mt-2 text-center text-xs text-ink-faint">You'll see the exact page count and price before paying.</p>
      <p className="mt-1 text-center text-xs text-ink-faint">
        <span className="inline-block">Card payment by Stripe ·</span> <span className="inline-block">Full refund if it can't be delivered ·</span>{" "}
        <span className="inline-block">Your document is deleted after sending</span>
      </p>
    </form>
  );
}
