"use client";
// Cloudflare Web Analytics (cookieless page-view counts, mentioned on the Privacy
// page), left out on the owner's own devices so the Visits row on /stats counts
// customers. Opening /stats marks a device as the owner's (OwnerDevice below).
import Script from "next/script";
import { useEffect, useState } from "react";

const OWNER_KEY = "fjo-owner";

export default function VisitCounter() {
  const [count, setCount] = useState(false);
  useEffect(() => {
    try {
      setCount(localStorage.getItem(OWNER_KEY) !== "1");
    } catch {
      setCount(true); // storage blocked: count the visit as usual
    }
  }, []);
  if (!count) return null;
  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon='{"token": "4200057a0bdf4025992003787d48ca7a"}'
      strategy="afterInteractive"
    />
  );
}

/** On /stats: marks this device as the owner's, so its visits stop counting. */
export function OwnerDevice() {
  const [marked, setMarked] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      localStorage.setItem(OWNER_KEY, "1");
      setMarked(true);
    } catch {
      setMarked(false);
    }
  }, []);
  if (marked === null) return null;
  return (
    <p className="mt-1 text-xs text-ink-faint">
      {marked
        ? "Your visits from this device aren't counted (private tabs still are)."
        : "This browser blocks site storage, so visits from it are still counted."}
    </p>
  );
}
