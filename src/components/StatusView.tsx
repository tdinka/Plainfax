"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FaxView } from "@/lib/view";

const FINAL = new Set(["DELIVERED", "FAILED"]);

function Step({ state, title, note }: { state: "done" | "active" | "todo" | "bad"; title: string; note?: string }) {
  const dot = {
    done: "bg-signal border-signal",
    active: "bg-white border-signal animate-pulse",
    todo: "bg-white border-line",
    bad: "bg-alert border-alert",
  }[state];
  return (
    <li className="flex gap-3">
      <span className={`mt-1 h-3.5 w-3.5 flex-none rounded-full border-2 ${dot}`} aria-hidden />
      <div>
        <p className={`text-sm font-medium ${state === "todo" ? "text-ink-faint" : "text-ink"}`}>{title}</p>
        {note && <p className="text-sm text-ink-soft">{note}</p>}
      </div>
    </li>
  );
}

export default function StatusView({ initial, justPaid }: { initial: FaxView; justPaid: boolean }) {
  const [fax, setFax] = useState(initial);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Poll while the fax is on its way.
  useEffect(() => {
    if (fax.status === "DRAFT" || FINAL.has(fax.status)) return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/faxes/${fax.token}`, { cache: "no-store" });
      if (res.ok) setFax(await res.json());
    }, 2500);
    return () => clearInterval(t);
  }, [fax.status, fax.token]);

  async function pay() {
    setPaying(true);
    setError(null);
    try {
      const res = await fetch(`/api/faxes/${fax.token}/checkout`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Checkout didn't start.");
      if (body.simulated) {
        const fresh = await fetch(`/api/faxes/${fax.token}`, { cache: "no-store" });
        setFax(await fresh.json());
        setPaying(false);
      } else {
        window.location.href = body.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout didn't start.");
      setPaying(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href.split("?")[0]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; the link is still in the address bar */
    }
  }

  const s = fax.status;
  const pagesLabel = `${fax.totalPages} page${fax.totalPages === 1 ? "" : "s"}${fax.hasCover ? " including cover" : ""}`;
  const testBanner =
    fax.paymentMode !== "live" || fax.faxMode !== "live"
      ? [
          fax.paymentMode === "simulated" && "payments are simulated (no card needed)",
          fax.paymentMode === "test" && "Stripe is in test mode (use card 4242 4242 4242 4242)",
          fax.faxMode === "simulated" && "the fax line is simulated (nothing is really sent; numbers ending 0000 fail on purpose)",
        ]
          .filter(Boolean)
          .join(", and ")
      : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      {testBanner && (
        <p className="mb-5 rounded-lg border border-toner/40 bg-toner-50 px-3 py-2 text-sm text-ink">
          <span className="font-semibold">Test mode:</span> {testBanner}.
        </p>
      )}

      <div className="sheet p-5 sm:p-6">
        <p className="eyebrow">{s === "DRAFT" ? "Review your fax" : "Fax status"}</p>
        <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
          To <span className="font-mono">{fax.to}</span>
        </h1>
        <dl className="mt-4 grid grid-cols-[auto,1fr] gap-x-6 gap-y-1.5 text-sm">
          <dt className="text-ink-soft">Pages</dt>
          <dd className="font-mono">{pagesLabel}</dd>
          <dt className="text-ink-soft">Files</dt>
          <dd className="min-w-0 break-words">{fax.fileNames}</dd>
          <dt className="text-ink-soft">Price</dt>
          <dd className="font-mono">{fax.price} one-time</dd>
        </dl>

        {s === "DRAFT" && (
          <div className="mt-6">
            <a href={`/api/faxes/${fax.token}/preview`} target="_blank" rel="noreferrer" className="btn-quiet w-full sm:w-auto">
              Preview exactly what will be sent
            </a>
            <button onClick={pay} disabled={paying} className="btn-send mt-3 w-full">
              {paying ? "Starting checkout…" : `Pay ${fax.price} and send`}
            </button>
            <p className="mt-2 text-center text-xs text-ink-faint">
              One payment, no subscription. Refunded automatically if the fax can't be delivered.
            </p>
            {error && (
              <p role="alert" className="mt-3 rounded-lg bg-alert-50 px-3 py-2 text-sm text-alert">
                {error}
              </p>
            )}
            <Link href="/" className="mt-4 block text-center text-sm text-ink-soft underline">
              Start over with different files
            </Link>
          </div>
        )}

        {s !== "DRAFT" && (
          <ol className="mt-6 space-y-4" aria-live="polite">
            <Step state="done" title="Paid" note={justPaid ? "Thanks! Your payment went through." : undefined} />
            <Step
              state={s === "PAID" || s === "SENDING" ? "active" : s === "FAILED" ? "bad" : "done"}
              title={fax.retrying ? "Line was busy, trying again shortly" : s === "FAILED" ? "Couldn't deliver" : "Sending"}
              note={
                s === "SENDING" || s === "PAID"
                  ? fax.retrying
                    ? "We'll redial automatically. You can close this page."
                    : "Dialing the fax machine and sending pages. This usually takes 1 to 3 minutes."
                  : s === "FAILED"
                    ? fax.failureMessage ?? undefined
                    : undefined
              }
            />
            {s !== "FAILED" && (
              <Step
                state={s === "DELIVERED" ? "done" : "todo"}
                title="Delivered"
                note={fax.deliveredAt ? new Date(fax.deliveredAt).toLocaleString() : undefined}
              />
            )}
          </ol>
        )}

        {s === "DELIVERED" && (
          <div className="mt-6 rounded-lg bg-signal-50 p-4">
            <p className="font-medium text-signal-dark">Your fax was delivered.</p>
            <p className="mt-1 text-sm text-ink-soft">We've deleted the document from our servers.</p>
            <a href={`/api/faxes/${fax.token}/receipt`} className="btn-quiet mt-3">
              Download delivery confirmation (PDF)
            </a>
          </div>
        )}

        {s === "FAILED" && (
          <div className="mt-6 rounded-lg bg-alert-50 p-4 text-sm">
            <p className="font-medium text-alert">We tried {fax.attempts} time{fax.attempts === 1 ? "" : "s"} and couldn't get it through.</p>
            <p className="mt-1 text-ink">
              {fax.refunded
                ? `Your ${fax.price} has been refunded. Card refunds usually show up within 5 to 10 business days.`
                : "We're refunding your payment now."}
            </p>
            <p className="mt-1 text-ink-soft">Double-check the number with the person you're faxing, then try again.</p>
          </div>
        )}
      </div>

      {s !== "DRAFT" && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <button onClick={copyLink} className="text-ink-soft underline">
            {copied ? "Link copied" : "Copy this page's link to check later"}
          </button>
          <Link href="/" className="btn-quiet">
            Send another fax
          </Link>
        </div>
      )}
    </div>
  );
}
