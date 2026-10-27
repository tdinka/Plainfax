// TODO before go-live: have this policy reviewed alongside the terms.
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/config";

export const metadata = { title: `Privacy | ${APP_NAME}` };

export default function Privacy() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 text-ink sm:px-6 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-3 [&_p]:text-ink-soft">
      <h1 className="font-display text-3xl font-bold">Privacy</h1>
      <h2>What we keep</h2>
      <p>For each fax we keep the number it went to, the page count, the file names, the delivery result, and your email if you gave one.</p>
      <h2>What we delete</h2>
      <p>The document itself is deleted from our servers as soon as the fax is delivered or our final attempt ends.</p>
      <p>If you upload a document but don't pay, it's deleted within 24 hours.</p>
      <h2>Payments</h2>
      <p>Card payments are handled by Stripe. We never see or store your card number.</p>
      <h2>Fax delivery</h2>
      <p>Our fax carrier receives your document only to transmit it.</p>
      <h2>Abuse prevention</h2>
      <p>We keep a scrambled, one-way version of your internet address to limit how many faxes one visitor can start per hour. We can't turn it back into your address.</p>
      <h2>Contact</h2>
      <p>To ask about or delete your records: <span className="select-all font-mono">{SUPPORT_EMAIL}</span></p>
    </article>
  );
}
