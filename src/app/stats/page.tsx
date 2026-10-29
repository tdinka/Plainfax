// Owner-only numbers for the 90-day review: uploads, paid, delivered, refunded.
// Password-protected by src/middleware.ts. Faxes sent on the simulated line
// (testing before go-live), and anything started before STATS_START, are left out.
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/config";
import { visitsBetween } from "@/lib/visitors";
import { FORM_ERROR_KINDS, type FormErrorKind } from "@/lib/formErrors";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stats", robots: { index: false, follow: false } };

const DAY = 24 * 60 * 60 * 1000;
// Counting starts at midnight Pacific time on Oct 28, 2026; earlier faxes were launch testing.
const STATS_START = new Date("2026-10-28T00:00:00-07:00");
const realFaxes: Prisma.FaxWhereInput = {
  AND: [{ createdAt: { gte: STATS_START } }, { OR: [{ provider: null }, { provider: { not: "mock" } }] }],
};
// Faxes started from a Google ad link (?ref=gads), saved by /api/faxes.
const fromAds: Prisma.FaxWhereInput = { events: { some: { type: "source", detail: "gads" } } };

// Errors the send form showed, by kind (src/lib/formErrors.ts). null if the
// FormError table isn't in the database yet, so the rest of the page still works.
async function formErrorCount(since: Date) {
  return prisma.formError.count({ where: { createdAt: { gte: since } } }).catch(() => null);
}

async function periodStats(since: Date | null) {
  const base: Prisma.FaxWhereInput = since ? { AND: [realFaxes, { createdAt: { gte: since } }] } : realFaxes;
  const [visits, formErrors, uploads, paid, paidFromAds, delivered, failed, refunded, paidSum, refundedSum] = await Promise.all([
    visitsBetween(since && since > STATS_START ? since : STATS_START, new Date()),
    formErrorCount(since && since > STATS_START ? since : STATS_START),
    prisma.fax.count({ where: base }),
    prisma.fax.count({ where: { AND: [base, { paidAt: { not: null } }] } }),
    prisma.fax.count({ where: { AND: [base, fromAds, { paidAt: { not: null } }] } }),
    prisma.fax.count({ where: { AND: [base, { status: "DELIVERED" }] } }),
    prisma.fax.count({ where: { AND: [base, { status: "FAILED" }] } }),
    prisma.fax.count({ where: { AND: [base, { refundedAt: { not: null } }] } }),
    prisma.fax.aggregate({ where: { AND: [base, { paidAt: { not: null } }] }, _sum: { priceCents: true } }),
    prisma.fax.aggregate({ where: { AND: [base, { refundedAt: { not: null } }] }, _sum: { priceCents: true } }),
  ]);
  const kept = (paidSum._sum.priceCents ?? 0) - (refundedSum._sum.priceCents ?? 0);
  return { visits, formErrors, uploads, paid, paidFromAds, delivered, failed, refunded, kept };
}

function pct(part: number, whole: number): string {
  return whole ? `${Math.round((part / whole) * 100)}%` : "–";
}

export default async function Stats() {
  const now = Date.now();
  const periods = [
    { label: "Last 7 days", stats: await periodStats(new Date(now - 7 * DAY)) },
    { label: "Last 30 days", stats: await periodStats(new Date(now - 30 * DAY)) },
    { label: "Since Oct 28", stats: await periodStats(null) },
  ];
  const recent = await prisma.fax.findMany({
    where: realFaxes,
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      createdAt: true, status: true, toNumber: true, totalPages: true, priceCents: true, paidAt: true, refundedAt: true, attempts: true,
      events: { where: { type: "source" }, select: { detail: true } },
    },
  });

  const errorKinds = await prisma.formError
    .groupBy({ by: ["kind"], where: { createdAt: { gte: STATS_START } }, _count: { _all: true }, orderBy: { _count: { kind: "desc" } } })
    .catch(() => null);

  const rows: [string, (s: (typeof periods)[number]["stats"]) => string, string?][] = [
    ["Visits", (s) => (s.visits ? String(s.visits.visits) : "–"), "From Cloudflare Web Analytics, leaving out /stats and bots; one visit can view several pages"],
    ["Page views", (s) => (s.visits ? String(s.visits.pageViews) : "–")],
    ["Uploads", (s) => String(s.uploads), "Started a fax (uploaded a document)"],
    ["Visit to upload", (s) => (s.visits ? pct(s.uploads, s.visits.visits) : "–"), "Share of visits that started a fax"],
    ["Form errors", (s) => (s.formErrors === null ? "–" : String(s.formErrors)), "Times the form showed an error; kinds are listed below"],
    [
      "Error rate",
      (s) => (s.formErrors === null ? "–" : pct(s.formErrors, s.formErrors + s.uploads)),
      "Share of tries at sending that hit an error instead of uploading",
    ],
    ["Paid", (s) => String(s.paid)],
    ["Upload to paid", (s) => pct(s.paid, s.uploads), "Plan's early target: 30% or more"],
    ["Paid from ads", (s) => String(s.paidFromAds), "Came from a Google ad link (?ref=gads)"],
    ["Delivered", (s) => String(s.delivered)],
    ["Failed", (s) => String(s.failed)],
    ["Delivery rate", (s) => pct(s.delivered, s.delivered + s.failed), "Target: 95% or more"],
    ["Refunded", (s) => String(s.refunded)],
    ["Refund rate", (s) => pct(s.refunded, s.paid), "Target: under 5%"],
    ["Money kept", (s) => formatPrice(s.kept), "Paid minus refunds, before Stripe and Telnyx fees"],
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Private</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Stats</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Counted by the day each fax was started, from October 28, 2026 on. Visits come from Cloudflare Web Analytics (your own visits count too); Google searches are in Search Console.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-paper-50 text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium" />
              {periods.map((p) => (
                <th key={p.label} className="px-4 py-3 text-right font-medium">
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(([label, value, note]) => (
              <tr key={label}>
                <td className="px-4 py-3">
                  <span className="font-medium">{label}</span>
                  {note && <span className="block text-xs text-ink-faint">{note}</span>}
                </td>
                {periods.map((p) => (
                  <td key={p.label} className="px-4 py-3 text-right font-mono">
                    {value(p.stats)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 font-display text-xl font-bold">Form errors by kind</h2>
      {!errorKinds?.length ? (
        <p className="mt-2 text-sm text-ink-soft">{errorKinds ? "No form errors since Oct 28." : "Not counting yet (the FormError table isn't in the database)."}</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-line">
              {errorKinds.map((e) => (
                <tr key={e.kind}>
                  <td className="px-4 py-2">{FORM_ERROR_KINDS[e.kind as FormErrorKind] ?? e.kind}</td>
                  <td className="px-4 py-2 text-right font-mono">{e._count._all}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-10 font-display text-xl font-bold">Recent faxes</h2>
      {recent.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">No faxes yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-paper-50 text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Started</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">To</th>
                <th className="px-4 py-3 text-right font-medium">Pages</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recent.map((f, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 font-mono text-xs">
                    {f.createdAt.toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-2">{f.status === "DRAFT" ? "Not paid" : f.status.charAt(0) + f.status.slice(1).toLowerCase()}</td>
                  <td className="px-4 py-2 font-mono text-xs">…{f.toNumber.slice(-4)}</td>
                  <td className="px-4 py-2 text-right font-mono">{f.totalPages}</td>
                  <td className="px-4 py-2 text-right font-mono">{formatPrice(f.priceCents)}</td>
                  <td className="px-4 py-2 text-xs text-ink-soft">
                    {[f.events[0] && `from ${f.events[0].detail}`, f.refundedAt && "refunded", f.attempts > 1 && `${f.attempts} attempts`]
                      .filter(Boolean)
                      .join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
