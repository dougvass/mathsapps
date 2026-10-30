"use client";

import { useState } from "react";
import type { Product } from "@/lib/product-types";
import { useCart } from "@/lib/cart-context";
import BuyNowButton from "./BuyNowButton";

const AMOUNTS = [10, 20, 50];

// Choose a gift card amount; the code appears on the thank-you page after paying.
export default function GiftCardBuilder({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [amount, setAmount] = useState(20);
  const [added, setAdded] = useState(false);
  const line = () => ({ productId: product.id, color: "", size: "", customText: "", extra: String(amount) });

  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-2 font-semibold text-ink">Choose an amount</legend>
        <div className="grid grid-cols-3 gap-2">
          {AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setAmount(value);
                setAdded(false);
              }}
              aria-pressed={amount === value}
              className={`rounded-2xl border-2 py-4 font-display text-2xl font-bold transition-colors ${amount === value ? "border-htz-orange bg-htz-orange text-white" : "border-ink/15 text-ink hover:border-htz-orange"}`}
            >
              ${value}
            </button>
          ))}
        </div>
      </fieldset>
      <button
        type="button"
        onClick={() => {
          addItem(line(), 1, { label: `$${amount} gift card`, unitCents: amount * 100 });
          setAdded(true);
        }}
        className="rounded-full bg-htz-lime py-3 font-display text-lg font-bold text-htz-navy shadow transition-transform hover:scale-[1.02]"
      >
        {added ? "✓ Added – add another?" : `🎟️ Add $${amount} gift card to cart`}
      </button>
      <BuyNowButton item={() => ({ ...line(), quantity: 1 })} className="py-3 font-display text-lg" />
      <ul className="flex flex-col gap-1 text-sm text-ink/70">
        <li>✉️ The gift card code shows straight after paying – copy it into a card or message.</li>
        <li>🛍️ It works like a discount code at checkout, once, for the full amount.</li>
        <li>📦 No postage needed for gift cards on their own.</li>
      </ul>
    </div>
  );
}
