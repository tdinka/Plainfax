import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-bold">We can't find that fax</h1>
      <p className="mt-2 text-ink-soft">Check the link, or start a new one.</p>
      <Link href="/" className="btn-send mt-6">Send a fax</Link>
    </div>
  );
}
