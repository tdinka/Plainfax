// Owner-only numbers for the 90-day review: uploads, paid, delivered, refunded.
// Password-protected by src/middleware.ts. Faxes sent on the simulated line
// (testing before go-live) are left out.
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stats", robots: { index: false, follow: false } };

const DAY = 24 * 60 * 60 * 1000;
const realFaxes: Prisma.FaxWhereInput = { OR: [{ provider: null }, { provider: { not: "mock" } }] };

async function periodStats(since: Date | null) {
  const base: Prisma.FaxWhereInput = since ? { AND: [realFaxes, { createdAt: { gte: since } }] } : realFaxes;
  const [uploads, paid, delivered, failed, refunded, paidSum, refundedSum] = await Promise.all([
    prisma.fax.count({ where: base }),
    prisma.fax.count({ where: { AND: [base, { paidAt: { not: null } }] } }),
    prisma.fax.count({ where: { AND: [base, { status: "DELIVERED" }] } }),
    prisma.fax.count({ where: { AND: [base, { status: "FAILED" }] } }),
    prisma.fax.count({ where: { AND: [base, { refundedAt: { not: null } }] } }),
    prisma.fax.aggregate({ where: { AND: [base, { paidAt: { not: null } }] }, _sum: { priceCents: true } }),
    prisma.fax.aggregate({ where: { AND: [base, { refundedAt: { not: null } }] }, _sum: { priceCents: true } }),
  ]);
  const kept = (paidSum._sum.priceCents ?? 0) - (refundedSum._sum.priceCents ?? 0);
  return { uploads, paid, delivered, failed, refunded, kept };
}

function pct(part: number, whole: number): string {
  return whole ? `${Math.round((part / whole) * 100)}%` : "–";
}

export default async function Stats() {
  const now = Date.now();
  const periods = [
    { label: "Last 7 days", stats: await periodStats(new Date(now - 7 * DAY)) },
    { label: "Last 30 days", stats: await periodStats(new Date(now - 30 * DAY)) },
    { label: "All time", stats: await periodStats(null) },
  ];
  const recent = await prisma.fax.findMany({
    where: realFaxes,
    orderBy: { createdAt: "desc" },
    take: 25,
    select: { createdAt: true, status: true, toNumber: true, totalPages: true, priceCents: true, paidAt: true, refundedAt: true, attempts: true },
  });

  const rows: [string, (s: (typeof periods)[number]["stats"]) => string, string?][] = [
    ["Uploads", (s) => String(s.uploads), "Started a fax (uploaded a document)"],
    ["Paid", (s) => String(s.paid)],
    ["Upload to paid", (s) => pct(s.paid, s.uploads), "Plan's early target: 30% or more"],
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
        Counted by the day each fax was started. Visitor numbers are in Cloudflare Web Analytics, and Google searches are in Search Console.
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
                    {[f.refundedAt && "refunded", f.attempts > 1 && `${f.attempts} attempts`].filter(Boolean).join(", ")}
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
