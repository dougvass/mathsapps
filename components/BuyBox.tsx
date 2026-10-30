"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import {
  cleanCustomText,
  MAX_CUSTOM_TEXT_LENGTH,
  stockLimit,
  type Product,
} from "@/lib/product-types";
import { useCart } from "@/lib/cart-context";
import { useShop } from "@/lib/shop-context";
import { loadSavedDiscount, saveDiscount, startCheckout } from "@/lib/checkout-client";
import { FREE_SHIPPING_THRESHOLD_AUD_CENTS } from "@/lib/site";
import StockBadge from "./StockBadge";
import StockAlertButton from "./StockAlertButton";
import { SHOW_SOLD_FROM } from "@/lib/shop-context";

const fieldClass =
  "rounded-lg border border-ink/20 bg-surface px-3 py-2 text-sm focus:border-htz-orange focus:outline-none";
const MAX_QUANTITY_CHOICES = 10;

// Product page buy box: options, quantity, Add to Cart and Buy Now.
export default function BuyBox({ product }: { product: Product }) {
  const { colors, sizeOptions, soldCounts } = useShop();
  const sold = soldCounts[product.id] ?? 0;
  const { items, addItem } = useCart();
  // With only one size there's nothing to choose.
  const [size, setSize] = useState(sizeOptions.length === 1 ? sizeOptions[0].label : "");
  const [color, setColor] = useState("");
  const [customText, setCustomText] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const text = cleanCustomText(customText);
  const outOfStock = product.stock === "out-of-stock";
  const inCart = items.filter((i) => i.productId === product.id).reduce((sum, i) => sum + i.quantity, 0);
  const available = stockLimit(product.stock) - inCart;
  const quantityChoices = Math.max(1, Math.min(MAX_QUANTITY_CHOICES, stockLimit(product.stock)));
  const missing = [
    product.chooseColor && !color ? "a colour" : null,
    !size ? "a size" : null,
    product.needsCustomText && !text ? "the text to print" : null,
  ].filter(Boolean);
  const ready = !outOfStock && missing.length === 0;

  let hint: string | null = null;
  if (outOfStock) hint = "Out of stock right now.";
  else if (missing.length > 0) hint = `Choose ${missing.join(" and ")} first.`;

  const line = () => ({
    productId: product.id,
    color: product.chooseColor ? color : "",
    size,
    customText: product.needsCustomText ? text : "",
  });

  function handleAdd(event: React.MouseEvent<HTMLButtonElement>) {
    if (!ready) return;
    setError(null);
    const added = addItem(line(), quantity);
    if (added < 1) {
      setError("All the stock we have is already in your cart.");
      return;
    }
    if (added < quantity) setError(`Only ${added} more could be added – that's all we have.`);
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

  // Goes straight to payment for just this item (the cart is left alone).
  async function handleBuyNow() {
    if (!ready) return;
    setError(null);
    setBuying(true);
    const item = { ...line(), quantity };
    let result = await startCheckout([item], loadSavedDiscount()?.code);
    if ("error" in result && result.discountError) {
      saveDiscount(null);
      result = await startCheckout([item]);
    }
    if ("url" in result) {
      window.location.href = result.url;
      return;
    }
    setError(result.error);
    setBuying(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-display text-3xl font-bold text-ink">
        <span className="align-top text-base">$</span>
        {product.price.toFixed(2)}
        <span className="ml-1 text-sm font-normal text-ink/50">AUD</span>
        {product.wasPrice > product.price && (
          <span className="ml-2 text-lg font-normal text-ink/50 line-through">${product.wasPrice.toFixed(2)}</span>
        )}
      </p>
      {product.wasPrice > product.price && (
        <p className="self-start rounded-md bg-htz-pink px-2 py-0.5 text-sm font-bold text-white">
          On sale – save ${(product.wasPrice - product.price).toFixed(2)}
        </p>
      )}
      {sold >= SHOW_SOLD_FROM && <p className="text-sm font-semibold text-htz-orange">🔥 {sold} sold so far</p>}
      <p className="text-sm text-ink/70">
        🚚 FREE shipping on orders over ${FREE_SHIPPING_THRESHOLD_AUD_CENTS / 100}
      </p>
      <StockBadge stock={product.stock} />
      {outOfStock && <StockAlertButton productId={product.id} />}

      {product.chooseColor && (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink">Colour</span>
          <select value={color} onChange={(e) => setColor(e.target.value)} className={fieldClass}>
            <option value="">Choose a colour…</option>
            {colors.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      )}

      {sizeOptions.length > 1 && (
        <fieldset>
          <legend className="mb-1 text-sm font-semibold text-ink">
            Size{size && <span className="font-normal text-ink/60">{`: ${size}`}</span>}
          </legend>
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            {sizeOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setSize(option.label)}
                aria-pressed={size === option.label}
                className={`rounded-lg border-2 px-3 py-1.5 text-left text-sm transition-colors ${size === option.label ? "border-htz-orange bg-htz-orange/10 font-semibold text-ink" : "border-ink/15 text-ink/80 hover:border-ink/40"}`}
              >
                {option.label}
                <span className="block text-xs text-ink/50">up to {option.maxDimensionMm}mm</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {product.needsCustomText && (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink">
            {"Name or text to print "}
            <span className="font-normal text-ink/50">
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

      {!outOfStock && (
        <label className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">Qty</span>
          <select
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className={`${fieldClass} w-20`}
            aria-label="Quantity"
          >
            {Array.from({ length: quantityChoices }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n} disabled={n > available && available > 0}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        type="button"
        onClick={handleAdd}
        disabled={!ready || available < 1}
        className={`w-full rounded-full bg-htz-lime py-3 font-display text-lg font-bold text-htz-navy shadow transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${justAdded ? "animate-pop" : ""}`}
      >
        Add to Cart
      </button>
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={!ready || buying}
        className="w-full rounded-full bg-htz-orange py-3 font-display text-lg font-bold text-white shadow transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        {buying ? "Redirecting…" : "Buy Now"}
      </button>
      {hint && <p className="text-center text-xs text-ink/60">{hint}</p>}
      {!outOfStock && available < 1 && missing.length === 0 && (
        <p className="text-center text-xs text-ink/60">All available stock is already in your cart.</p>
      )}
      {error && <p className="text-center text-sm font-semibold text-htz-pink">{error}</p>}
      <p className="text-center text-xs text-ink/50">🔒 Secure payment by Stripe</p>
    </div>
  );
}
