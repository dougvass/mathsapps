"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import type { Product } from "@/lib/product-types";
import { useCart } from "@/lib/cart-context";
import ProductImage from "./ProductImage";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleAddToCart(event: React.MouseEvent<HTMLButtonElement>) {
    addItem(product.id);

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 350);

    const rect = event.currentTarget.getBoundingClientRect();
    confetti({
      particleCount: 36,
      spread: 65,
      startVelocity: 28,
      gravity: 1.1,
      ticks: 80,
      scalar: 0.8,
      origin: {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      },
      colors: ["#ff6a1a", "#ff4d94", "#c6f53e", "#103c45"],
    });
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border-4 border-htz-navy/5 bg-white shadow-md transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="aspect-square overflow-hidden transition-transform duration-300 group-hover:animate-wiggle">
        <ProductImage product={product} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg font-semibold text-htz-navy">
          {product.name}
        </h3>
        <p className="flex-1 text-sm text-htz-navy/70">{product.description}</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="font-display text-xl font-bold text-htz-orange">
            ${product.price.toFixed(2)}
          </span>
          <button
            type="button"
            onClick={handleAddToCart}
            className={`rounded-full bg-htz-lime px-4 py-2 text-sm font-bold text-htz-navy shadow transition-transform hover:scale-105 active:scale-95 ${justAdded ? "animate-pop" : ""}`}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
