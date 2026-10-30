"use client";

import { useState } from "react";
import type { CartItem } from "@/lib/cart-context";
import { buyNow } from "@/lib/checkout-client";

// Orange "Buy Now" that skips the cart and goes to payment.
export default function BuyNowButton({
  item,
  disabled = false,
  className = "",
  label = "Buy Now",
}: {
  item: () => CartItem;
  disabled?: boolean;
  className?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const problem = await buyNow(item());
          if (problem) {
            setError(problem);
            setBusy(false);
          }
        }}
        className={`rounded-full bg-htz-orange font-bold text-white shadow transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${className}`}
      >
        {busy ? "Opening payment…" : label}
      </button>
      {error && <p className="text-center text-xs font-semibold text-htz-pink">{error}</p>}
    </>
  );
}
