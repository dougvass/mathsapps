"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import type { Product, SizeOption, StockLevel } from "@/lib/product-types";
import { useCart } from "@/lib/cart-context";
import ProductImage from "./ProductImage";

function StockBadge({ stock }: { stock: StockLevel }) {
  const [label, style] =
    stock === "out-of-stock"
      ? ["Out of stock", "bg-htz-pink/10 text-htz-pink"]
      : stock === "made-to-order"
        ? ["Made to order", "bg-htz-navy/5 text-htz-navy/70"]
        : [`${stock} in stock`, "bg-htz-teal/10 text-htz-teal"];

  return (
    <span className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}

export default function ProductCard({
  product,
  colors,
  sizeOptions,
}: {
  product: Product;
  colors: string[];
  sizeOptions: SizeOption[];
}) {
  const { addItem, canAddMore } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");

  const outOfStock = product.stock === "out-of-stock";
  const stockLeft = !outOfStock && canAddMore(product.id);
  const optionsChosen = (!product.chooseColor || color !== "") && size !== "";
  const canAdd = stockLeft && optionsChosen;

  let disabledReason: string | undefined;
  if (outOfStock) disabledReason = "Out of stock";
  else if (!stockLeft) disabledReason = "All available stock is already in your cart";
  else if (!optionsChosen)
    disabledReason = product.chooseColor ? "Pick a colour and size first" : "Pick a size first";

  function handleAddToCart(event: React.MouseEvent<HTMLButtonElement>) {
    if (!canAdd) return;

    addItem(product.id, color, size);

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
    <div
      id={`product-${product.id}`}
      className="group flex scroll-mt-24 flex-col overflow-hidden rounded-3xl border-4 border-htz-navy/5 bg-white shadow-md transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="aspect-square overflow-hidden transition-transform duration-300 group-hover:animate-wiggle">
        <ProductImage product={product} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg font-semibold text-htz-navy">
          {product.name}
        </h3>
        <p className="flex-1 text-sm text-htz-navy/70">{product.description}</p>

        <StockBadge stock={product.stock} />

        <div className="grid grid-cols-2 gap-2">
          {product.chooseColor && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-htz-navy/70">Colour</span>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="rounded-lg border border-htz-navy/20 px-2 py-1.5 text-sm focus:border-htz-orange focus:outline-none"
            >
              <option value="">Choose…</option>
              {colors.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-htz-navy/70">Size</span>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="rounded-lg border border-htz-navy/20 px-2 py-1.5 text-sm focus:border-htz-orange focus:outline-none"
            >
              <option value="">Choose…</option>
              {sizeOptions.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label} (up to {option.maxDimensionMm}mm)
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="font-display text-xl font-bold text-htz-orange">
            ${product.price.toFixed(2)}
          </span>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAdd}
            title={disabledReason}
            className={`rounded-full bg-htz-lime px-4 py-2 text-sm font-bold text-htz-navy shadow transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${justAdded ? "animate-pop" : ""}`}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
