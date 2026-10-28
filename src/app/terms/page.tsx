// TODO before go-live: have these terms reviewed (a lawyer or a reputable template service).
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/config";

export const metadata = { title: `Terms of service | ${APP_NAME}` };

export default function Terms() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 text-ink sm:px-6 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-3 [&_p]:text-ink-soft">
      <h1 className="font-display text-3xl font-bold">Terms of service</h1>
      <p>Last updated: October 28, 2026</p>
      <h2>Who we are</h2>
      <p>{APP_NAME} is operated by Tsega Dinka, an individual based in Los Angeles, California. "We" and "us" in these terms means {APP_NAME} and its operator.</p>
      <h2>What you're buying</h2>
      <p>Each payment covers one attempt to deliver one fax to the number you entered. There is no subscription and nothing renews.</p>
      <p>A "delivered" status and confirmation PDF mean the receiving fax machine accepted the transmission. They don't confirm that a person received, read, or acted on it, or that every page printed clearly.</p>
      <h2>Refunds</h2>
      <p>If we can't deliver your fax after our automatic retries, we refund the full amount to your card automatically.</p>
      <p>If you pay more than 24 hours after uploading, your document will already have been deleted, so the fax isn't sent and we refund the full amount automatically.</p>
      <p>Faxes that are delivered can't be refunded, including faxes sent to the wrong number. Please check the number before paying.</p>
      <h2>No guarantees</h2>
      <p>We work hard to deliver every fax, but fax delivery depends on phone networks and the receiving machine, which we don't control. We can't guarantee that a fax will be delivered, delivered by a certain time, or received legibly. If your fax is time-sensitive, confirm with the recipient that it arrived.</p>
      <h2>Limit on our responsibility</h2>
      <p>To the fullest extent allowed by law, our total responsibility for any claim related to a fax is limited to the amount you paid for that fax. We aren't responsible for indirect or consequential losses, such as missed deadlines, lost opportunities, or decisions made because a fax was or wasn't received.</p>
      <h2>Acceptable use</h2>
      <p>Don't use {APP_NAME} to send unsolicited advertising, harassment, or anything illegal. We may refuse or stop faxes that break these rules.</p>
      <p>You're responsible for what you send, and for having the right to send it to that number.</p>
      <h2>Your documents</h2>
      <p>You keep all rights to what you send. We store your document only as long as needed to deliver it.</p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws of the State of California. Any dispute will be handled in the state or federal courts located in Los Angeles County, California.</p>
      <h2>Changes to these terms</h2>
      <p>We may update these terms. The version that applies to your fax is the one shown here when you paid.</p>
      <h2>Contact</h2>
      <p>Questions or problems: <span className="select-all font-mono">{SUPPORT_EMAIL}</span></p>
    </article>
  );
}
