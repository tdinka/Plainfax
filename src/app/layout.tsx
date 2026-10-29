import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Script from "next/script";
import "@fontsource-variable/archivo";
import "@fontsource-variable/public-sans";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/config";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: `${APP_NAME}: Send a fax online for $2.99, no subscription`,
  description:
    "Send a fax from your phone or computer. Upload a PDF or photo, enter the fax number, pay $2.99 once. Automatic refund if it can't be delivered.",
  applicationName: APP_NAME,
};

export const viewport: Viewport = { themeColor: "#15202B", width: "device-width", initialScale: 1 };

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
      <span aria-hidden className="flex gap-[3px]">
        <span className="h-2 w-2 rounded-full bg-ink" />
        <span className="h-2 w-2 rounded-full bg-ink/60" />
        <span className="h-2 w-2 rounded-full bg-signal" />
      </span>
      {APP_NAME}
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-line bg-paper-50/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Wordmark />
            <nav className="-my-2 flex gap-3 text-sm text-ink-soft sm:gap-5">
              <Link href="/#pricing" className="inline-flex min-h-11 items-center px-1 hover:text-ink">Pricing</Link>
              <Link href="/#faq" className="inline-flex min-h-11 items-center px-1 hover:text-ink">Questions</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="mt-20 border-t border-line">
          <nav aria-label="Ways to fax" className="mx-auto flex max-w-6xl flex-wrap gap-x-5 px-4 pt-6 text-sm text-ink-soft sm:px-6">
            {GUIDES.map((g) => (
              <Link key={g.slug} href={`/${g.slug}`} className="inline-flex min-h-11 items-center hover:text-ink">
                {g.linkText}
              </Link>
            ))}
          </nav>
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              {APP_NAME}. Pay per fax, no subscription. Help: <span className="select-all font-mono">{SUPPORT_EMAIL}</span>
            </p>
            <div className="-my-3 flex gap-5">
              <Link href="/terms" className="inline-flex min-h-11 items-center hover:text-ink">Terms</Link>
              <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-ink">Privacy</Link>
            </div>
          </div>
        </footer>
        {/* Cloudflare Web Analytics: cookieless page-view counts (mentioned on the Privacy page) */}
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "4200057a0bdf4025992003787d48ca7a"}'
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
