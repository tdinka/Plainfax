import SendForm from "@/components/SendForm";
import { APP_NAME, PRICE_TIERS, formatPrice } from "@/lib/config";

const steps = [
  ["Upload", "A PDF from your computer, or snap photos of the pages with your phone."],
  ["Enter the number", "Any US or Canada fax number. Add a free cover page if you like."],
  ["Pay once and track it", "Watch it go through live, then download a delivery confirmation."],
];

const faqs: [string, string][] = [
  [
    "Do I need a fax machine or a phone line?",
    "No. We send the fax from our line to theirs. The person receiving it gets a normal fax on their machine or fax service.",
  ],
  [
    "Is there a subscription?",
    `No. You pay ${formatPrice(PRICE_TIERS[0].cents)} for a fax up to 10 pages and that's it. Nothing renews, and there's no account to cancel.`,
  ],
  [
    "What if the fax doesn't go through?",
    "If the line is busy or doesn't answer, we redial automatically. If it still can't be delivered, we refund your payment automatically. You don't need to contact anyone.",
  ],
  [
    "How do I prove I sent it?",
    "Once the fax is delivered you can download a confirmation PDF with the number, page count and delivery time.",
  ],
  [
    "What happens to my document?",
    "It's stored only while the fax is being sent, then deleted from our servers as soon as it's delivered or the attempt ends. Your status page keeps only the fax number, page count and file names.",
  ],
  [
    "Can I fax medical or insurance forms?",
    `You can fax your own forms, like a signed authorization to your doctor's office. ${APP_NAME} isn't set up yet for healthcare offices that need a HIPAA business associate agreement.`,
  ],
  [
    "Can I receive faxes or send outside the US and Canada?",
    "Not yet. Right now it's sending only, to US and Canada numbers.",
  ],
];

export default function Home() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-8 pt-10 sm:px-6 lg:grid-cols-[1fr,minmax(0,460px)] lg:gap-14 lg:pt-16">
        <div className="min-w-0 lg:pt-6">
          <p className="eyebrow">Send a fax online</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            Fax from your phone.<br />
            {formatPrice(PRICE_TIERS[0].cents)}. <span className="inline-block">No subscription.</span>
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg text-ink-soft">
            Snap photos of the pages or upload a PDF, and it's sent in about a minute. Works on a computer too. If it can't be delivered, your money comes back automatically.
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            {[
              "No account, no app to download",
              "Free cover page and delivery confirmation",
              "No ads or branding on your fax",
              "Busy line? We redial for you",
              "Your document is deleted after it's sent",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-signal" />
                {t}
              </li>
            ))}
          </ul>

          <div className="mt-10 hidden rounded-xl border border-line bg-white/60 p-5 lg:block">
            <p className="eyebrow">How it compares</p>
            <table className="mt-3 w-full text-sm">
              <tbody className="divide-y divide-line">
                <tr>
                  <td className="py-2 text-ink-soft">Popular fax apps</td>
                  <td className="py-2 text-right font-mono">$9.99 a week, renews automatically</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">{APP_NAME}</td>
                  <td className="py-2 text-right font-mono font-medium text-signal-dark">
                    {formatPrice(PRICE_TIERS[0].cents)} once, nothing renews
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="min-w-0">
          <SendForm />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl font-bold">How it works</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {steps.map(([title, body], i) => (
            <li key={title} className="rounded-xl border border-line bg-white p-5">
              <span className="font-mono text-sm text-ink-faint">Step {i + 1}</span>
              <p className="mt-1 font-display text-lg font-semibold">{title}</p>
              <p className="mt-1 text-sm text-ink-soft">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl font-bold">Pricing</h2>
        <p className="mt-2 text-ink-soft">Priced by the pages in your document. The cover page is always free.</p>
        <div className="mt-6 overflow-hidden rounded-xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-50 text-ink-soft">
              <tr>
                <th className="px-5 py-3 font-medium">Pages</th>
                <th className="px-5 py-3 font-medium">Price per fax</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Includes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {PRICE_TIERS.map((t, i) => (
                <tr key={t.upTo}>
                  <td className="whitespace-nowrap px-5 py-3 font-mono">
                    {i === 0 ? 1 : PRICE_TIERS[i - 1].upTo + 1} to {t.upTo}
                  </td>
                  <td className="px-5 py-3 font-mono font-semibold">{formatPrice(t.cents)}</td>
                  <td className="hidden px-5 py-3 text-ink-soft sm:table-cell">Cover page, automatic redial, confirmation, refund if undelivered</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* On phones the "Includes" column is hidden (it's the same for every row), so it's said once here. */}
        <p className="mt-3 text-sm text-ink-soft sm:hidden">Every fax includes a cover page, automatic redial, a delivery confirmation, and a refund if it can't be delivered.</p>
      </section>

      <section id="faq" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl font-bold">Questions</h2>
        <div className="mt-6 max-w-3xl divide-y divide-line rounded-xl border border-line bg-white">
          {faqs.map(([q, a]) => (
            <details key={q} className="group px-5 py-4">
              <summary className="cursor-pointer list-none font-medium marker:hidden">
                <span className="flex items-center justify-between gap-4">
                  {q}
                  <span aria-hidden className="font-mono text-ink-faint transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-2 text-sm text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
