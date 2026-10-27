// TODO before go-live: have these terms reviewed (a lawyer or a reputable template service).
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/config";

export const metadata = { title: `Terms of service | ${APP_NAME}` };

export default function Terms() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 text-ink sm:px-6 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-3 [&_p]:text-ink-soft">
      <h1 className="font-display text-3xl font-bold">Terms of service</h1>
      <h2>What you're buying</h2>
      <p>Each payment covers one attempt to deliver one fax to the number you entered. There is no subscription and nothing renews.</p>
      <h2>Refunds</h2>
      <p>If we can't deliver your fax after our automatic retries, we refund the full amount to your card automatically.</p>
      <p>Faxes that are delivered can't be refunded, including faxes sent to the wrong number. Please check the number before paying.</p>
      <h2>Acceptable use</h2>
      <p>Don't use {APP_NAME} to send unsolicited advertising, harassment, or anything illegal. We may refuse or stop faxes that break these rules.</p>
      <h2>Your documents</h2>
      <p>You keep all rights to what you send. We store your document only as long as needed to deliver it.</p>
      <h2>Contact</h2>
      <p>Questions or problems: <span className="select-all font-mono">{SUPPORT_EMAIL}</span></p>
    </article>
  );
}
