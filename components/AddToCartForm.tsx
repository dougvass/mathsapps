"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import {
  cleanCustomText,
  MAX_CUSTOM_TEXT_LENGTH,
  type Product,
  type SizeOption,
} from "@/lib/product-types";
import { useCart } from "@/lib/cart-context";

const fieldClass =
  "rounded-lg border border-htz-navy/20 bg-white px-2 py-1.5 text-sm focus:border-htz-orange focus:outline-none";

export default function AddToCartForm({
  product,
  colors,
  sizeOptions,
  large = false,
}: {
  product: Product;
  colors: string[];
  sizeOptions: SizeOption[];
  large?: boolean;
}) {
  const { addItem, canAddMore } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [customText, setCustomText] = useState("");

  const text = cleanCustomText(customText);
  const outOfStock = product.stock === "out-of-stock";
  const stockLeft = !outOfStock && canAddMore(product.id);
  const missing = [
    product.chooseColor && !color ? "a colour" : null,
    !size ? "a size" : null,
    product.needsCustomText && !text ? "the text to print" : null,
  ].filter(Boolean);
  const canAdd = stockLeft && missing.length === 0;

  let disabledReason: string | undefined;
  if (outOfStock) disabledReason = "Out of stock";
  else if (!stockLeft) disabledReason = "All available stock is already in your cart";
  else if (missing.length > 0) disabledReason = `Add ${missing.join(" and ")} first`;

  function handleAddToCart(event: React.MouseEvent<HTMLButtonElement>) {
    if (!canAdd) return;

    addItem({ productId: product.id, color, size, customText: product.needsCustomText ? text : "" });
    setCustomText("");

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
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        {product.chooseColor && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-htz-navy/70">Colour</span>
            <select value={color} onChange={(e) => setColor(e.target.value)} className={fieldClass}>
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
          <select value={size} onChange={(e) => setSize(e.target.value)} className={fieldClass}>
            <option value="">Choose…</option>
            {sizeOptions.map((option) => (
              <option key={option.label} value={option.label}>
                {option.label} (up to {option.maxDimensionMm}mm)
              </option>
            ))}
          </select>
        </label>

        {product.needsCustomText && (
          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-xs font-semibold text-htz-navy/70">
              Name or text to print{" "}
              <span className="font-normal text-htz-navy/50">
                ({customText.length}/{MAX_CUSTOM_TEXT_LENGTH})
              </span>
            </span>
            <input
              type="text"
              value={customText}
              maxLength={MAX_CUSTOM_TEXT_LENGTH}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g. HUGO"
              className={fieldClass}
            />
          </label>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <span
          className={`font-display font-bold text-htz-orange ${large ? "text-3xl" : "text-xl"}`}
        >
          ${product.price.toFixed(2)}
        </span>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canAdd}
          title={disabledReason}
          className={`rounded-full bg-htz-lime font-bold text-htz-navy shadow transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${large ? "px-8 py-3 text-base" : "px-4 py-2 text-sm"} ${justAdded ? "animate-pop" : ""}`}
        >
          Add to Cart
        </button>
      </div>
      {large && disabledReason && (
        <p className="text-right text-xs text-htz-navy/60">{disabledReason}</p>
      )}
    </div>
  );
}
