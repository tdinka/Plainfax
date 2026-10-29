// TODO before go-live: have this policy reviewed alongside the terms.
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/config";

export const metadata = { title: `Privacy | ${APP_NAME}` };

export default function Privacy() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 text-ink sm:px-6 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-3 [&_p]:text-ink-soft">
      <h1 className="font-display text-3xl font-bold">Privacy</h1>
      <p>Last updated: October 29, 2026</p>
      <h2>What we keep</h2>
      <p>For each fax we keep the number it went to, the page count, the file names, the delivery result, and your email if you gave one. If you came from one of our ads, we also note that, using a tag in the ad's link rather than a cookie.</p>
      <p>When the send form shows an error, such as a fax number that's too short, we note which kind of error it was and when. We don't save your files, the number or your email with it.</p>
      <p>We keep these records as long as we need them for support questions, refunds, and our tax and accounting records. Ask us and we'll delete yours sooner, unless the law requires us to keep it.</p>
      <h2>What we delete</h2>
      <p>The document itself is deleted from our servers as soon as the fax is delivered or our final attempt ends. That includes the cover page, if you added one, with the names, contact details and message you typed into it.</p>
      <p>If you upload a document but don't pay, it's deleted within 24 hours.</p>
      <h2>Payments</h2>
      <p>Card payments are handled by Stripe. We never see or store your card number. Stripe keeps its own record of the payment under its <a href="https://stripe.com/privacy" className="underline">privacy policy</a>.</p>
      <p>If you give your email, we pass it to Stripe so it can send your receipt. We don't use it for anything else.</p>
      <h2>Fax delivery</h2>
      <p>Faxes are sent through Telnyx, our fax carrier. Telnyx receives your document and the fax number only to transmit it. We don't ask Telnyx to store a copy of your document, and the private link it uses to fetch the document stops working once the fax finishes. Telnyx keeps its own record of the fax call, such as the numbers and the result, under its <a href="https://telnyx.com/privacy-policy" className="underline">privacy policy</a>.</p>
      <h2>Hosting</h2>
      <p>The site and its database run on Railway, which stores the records above, and your document until it's deleted, under its <a href="https://railway.com/legal/privacy" className="underline">privacy policy</a>.</p>
      <h2>Support email</h2>
      <p>Emails to our support address pass through Cloudflare Email Routing and arrive in a Gmail inbox, so Cloudflare and Google handle them under their own privacy policies (<a href="https://www.cloudflare.com/privacypolicy/" className="underline">Cloudflare</a>, <a href="https://policies.google.com/privacy" className="underline">Google</a>).</p>
      <h2>Your status link</h2>
      <p>Each fax has a private status page link. Anyone with that link can see the fax number, the file names and the delivery status, so share it only with people you trust.</p>
      <h2>Visitor counts</h2>
      <p>We use Cloudflare Web Analytics to count page visits. It doesn't use cookies or track you across other websites.</p>
      <h2>Abuse prevention</h2>
      <p>We keep a scrambled, one-way version of your internet address to limit how many faxes one visitor can start per hour. We can't turn it back into your address.</p>
      <h2>Who else sees your information</h2>
      <p>Only the companies named above, and only for the job described. We don't sell your information or use it for advertising.</p>
      <h2>Contact</h2>
      <p>To ask about or delete your records: <span className="select-all font-mono">{SUPPORT_EMAIL}</span></p>
    </article>
  );
}
