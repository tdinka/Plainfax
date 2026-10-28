import type { Metadata } from "next";
import Link from "next/link";
import SendForm from "@/components/SendForm";
import { GUIDES, getGuide } from "@/lib/guides";

export function guideMetadata(slug: string): Metadata {
  const g = getGuide(slug);
  return { title: g.metaTitle, description: g.description };
}

export default function GuidePage({ slug }: { slug: string }) {
  const g = getGuide(slug);
  const others = GUIDES.filter((o) => o.slug !== slug);

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-8 pt-10 sm:px-6 lg:grid-cols-[1fr,minmax(0,460px)] lg:gap-14 lg:pt-16">
        <div className="min-w-0 lg:pt-6">
          <p className="eyebrow">{g.eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">{g.title}</h1>
          <p className="mt-5 max-w-[52ch] text-lg text-ink-soft">{g.intro}</p>
          <ol className="mt-6 space-y-3">
            {g.steps.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm">
                <span className="w-5 flex-none font-mono text-ink-faint">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="min-w-0">
          <SendForm />
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {g.sections.map((s) => (
          <section key={s.heading} className="mt-10 first:mt-0">
            <h2 className="font-display text-2xl font-bold">{s.heading}</h2>
            {s.body.length === 1 ? (
              <p className="mt-3 text-ink-soft">{s.body[0]}</p>
            ) : (
              <ul className="mt-3 space-y-2 text-ink-soft">
                {s.body.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <span aria-hidden className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-signal" />
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">Questions</h2>
          <div className="mt-4 divide-y divide-line rounded-xl border border-line bg-white">
            {g.faqs.map(([q, a]) => (
              <div key={q} className="px-5 py-4">
                <h3 className="font-medium">{q}</h3>
                <p className="mt-1 text-sm text-ink-soft">{a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <p className="eyebrow">More ways to fax</p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/${o.slug}`} className="text-ink-soft underline hover:text-ink">
                  {o.linkText}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/#pricing" className="text-ink-soft underline hover:text-ink">
                Pricing
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
