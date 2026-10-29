// Visit counts from Cloudflare Web Analytics (the beacon in layout.tsx), for the
// stats page. Read-only; nothing about visitors is stored by us. Returns null when
// the Cloudflare settings are missing or the request fails, so the page still works.

const API = "https://api.cloudflare.com/client/v4/graphql";
// Over about a week, Cloudflare answers with a sampled estimate (rounded to tens)
// instead of an exact count, so longer ranges are asked for in 7-day pieces and
// added up. A piece that still comes back sampled is split in half and asked again.
const DAY = 24 * 60 * 60 * 1000;
const CHUNK = 7 * DAY;

export type Visits = { visits: number; pageViews: number };

const QUERY = `query ($account: string!, $filter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!) {
  viewer {
    accounts(filter: { accountTag: $account }) {
      rumPageloadEventsAdaptiveGroups(limit: 1, filter: $filter) {
        count
        sum { visits }
        avg { sampleInterval }
      }
    }
  }
}`;

async function queryRange(from: Date, to: Date): Promise<Visits> {
  const res = await fetch(API, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: QUERY,
      variables: {
        account: process.env.CLOUDFLARE_ACCOUNT_ID,
        filter: { siteTag: process.env.CLOUDFLARE_SITE_TAG, datetime_geq: from.toISOString(), datetime_lt: to.toISOString() },
      },
    }),
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || json.errors?.length) throw new Error(JSON.stringify(json.errors ?? res.status));
  const group = json.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups?.[0];
  if ((group?.avg?.sampleInterval ?? 1) > 1 && to.getTime() - from.getTime() > DAY) {
    const mid = new Date((from.getTime() + to.getTime()) / 2);
    const [a, b] = await Promise.all([queryRange(from, mid), queryRange(mid, to)]);
    return { visits: a.visits + b.visits, pageViews: a.pageViews + b.pageViews };
  }
  return { visits: group?.sum?.visits ?? 0, pageViews: group?.count ?? 0 };
}

export async function visitsBetween(from: Date, to: Date): Promise<Visits | null> {
  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_SITE_TAG) return null;
  try {
    const ranges: [Date, Date][] = [];
    for (let start = from.getTime(); start < to.getTime(); start += CHUNK) {
      ranges.push([new Date(start), new Date(Math.min(start + CHUNK, to.getTime()))]);
    }
    const parts = await Promise.all(ranges.map(([a, b]) => queryRange(a, b)));
    return parts.reduce((t, p) => ({ visits: t.visits + p.visits, pageViews: t.pageViews + p.pageViews }), { visits: 0, pageViews: 0 });
  } catch (err) {
    console.error("cloudflare visits failed", err);
    return null;
  }
}
