"use client";

import { useState } from "react";
import type { Product } from "@/lib/product-types";
import { useCart } from "@/lib/cart-context";
import { MYSTERY_COLOURS, MYSTERY_LIKES, mysteryWishes } from "@/lib/mystery-bag";

const LIKE_ICONS: Record<string, string> = {
  Fidgets: "🌀",
  Clickers: "🔘",
  Animals: "🦊",
  Dragons: "🐉",
  Puzzles: "🧩",
};

// Pick what you like, and we pack a surprise bag to match.
export default function MysteryBagBuilder({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [likes, setLikes] = useState<string[]>([]);
  const [colours, setColours] = useState<string>(MYSTERY_COLOURS[MYSTERY_COLOURS.length - 1]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock === "out-of-stock";

  function toggle(like: string) {
    setAdded(false);
    setLikes((prev) => (prev.includes(like) ? prev.filter((l) => l !== like) : [...prev, like]));
  }

  function add() {
    const wishes = mysteryWishes(likes, colours);
    addItem({ productId: product.id, color: "", size: "", customText: "", extra: wishes }, quantity, { label: wishes });
    setAdded(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="font-display text-3xl font-bold text-ink">${product.price.toFixed(2)}</p>
      <fieldset>
        <legend className="mb-2 font-semibold text-ink">1. What do you like? <span className="font-normal text-ink/50">(pick any, or none for a total surprise)</span></legend>
        <div className="flex flex-wrap gap-2">
          {MYSTERY_LIKES.map((like) => (
            <button
              key={like}
              type="button"
              onClick={() => toggle(like)}
              aria-pressed={likes.includes(like)}
              className={`rounded-full border-2 px-4 py-2 font-semibold transition-colors ${likes.includes(like) ? "border-htz-orange bg-htz-orange text-white" : "border-ink/15 text-ink hover:border-htz-orange"}`}
            >
              {LIKE_ICONS[like]} {like}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-semibold text-ink">2. Favourite colours?</legend>
        <div className="flex flex-wrap gap-2">
          {MYSTERY_COLOURS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setColours(option);
                setAdded(false);
              }}
              aria-pressed={colours === option}
              className={`rounded-full border-2 px-4 py-2 font-semibold transition-colors ${colours === option ? "border-htz-teal bg-htz-teal text-white" : "border-ink/15 text-ink hover:border-htz-teal"}`}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 font-semibold text-ink">
        3. How many bags?
        <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-20 rounded-lg border border-ink/20 px-3 py-2" aria-label="Quantity">
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={add}
        disabled={outOfStock}
        className="rounded-full bg-htz-lime py-3 font-display text-lg font-bold text-htz-navy shadow transition-transform hover:scale-[1.02] disabled:opacity-50"
      >
        {outOfStock ? "Sold out for now" : added ? "✓ Added – add another?" : "🎁 Add mystery bag to cart"}
      </button>
      <p className="text-sm text-ink/60">Each bag has 3–5 toys picked by hand to match your choices. No two bags are the same!</p>
    </div>
  );
}
