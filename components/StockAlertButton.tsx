"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount } from "@/lib/account-context";

// "Tell me when it's back" for out-of-stock toys (shows on the shopper's account).
export default function StockAlertButton({ productId }: { productId: string }) {
  const { account, refresh } = useAccount();
  const [busy, setBusy] = useState(false);

  if (!account) {
    return (
      <Link href="/account" className="text-sm font-semibold text-accent hover:underline">
        🔔 Sign in to get told when it&apos;s back
      </Link>
    );
  }

  const on = account.stockAlerts.includes(productId);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/account/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, on: !on }),
        }).catch(() => {});
        await refresh();
        setBusy(false);
      }}
      aria-pressed={on}
      className={`w-full rounded-full border-2 py-2.5 font-semibold transition-colors disabled:opacity-50 ${on ? "border-htz-teal bg-htz-teal/10 text-accent" : "border-ink/20 text-ink hover:border-htz-teal"}`}
    >
      {on ? "🔔 We'll show you when it's back (tap to cancel)" : "🔔 Tell me when it's back"}
    </button>
  );
}
