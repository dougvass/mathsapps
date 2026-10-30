"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/product-types";

// On phones, once the buy box scrolls out of view, a bar at the bottom keeps
// the price and a button to jump back to it.
export default function MobileBuyBar({ product }: { product: Product }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const box = document.getElementById("buy-box");
    if (!box) return;
    const observer = new IntersectionObserver(([entry]) => {
      // Show only after scrolling past the box, not before reaching it.
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  if (!visible || product.stock === "out-of-stock") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-ink/10 bg-surface/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
        <p className="font-display text-lg font-bold text-ink">${product.price.toFixed(2)}</p>
      </div>
      <button
        type="button"
        onClick={() => document.getElementById("buy-box")?.scrollIntoView({ behavior: "smooth" })}
        className="shrink-0 rounded-full bg-htz-lime px-6 py-3 font-display font-bold text-htz-navy shadow"
      >
        Add to Cart
      </button>
    </div>
  );
}
