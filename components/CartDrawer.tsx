"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { lineId, useCart } from "@/lib/cart-context";
import { discountCents, type AppliedDiscount } from "@/lib/discount-lookup";
import { FREE_SHIPPING_THRESHOLD_AUD_CENTS } from "@/lib/site";
import ProductImage from "./ProductImage";

const DISCOUNT_STORAGE_KEY = "htz-discount";

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CartDrawer() {
  const { lines, isOpen, closeCart, setQuantity, removeItem, canAddMore, totalItems, totalPrice } =
    useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [codeInput, setCodeInput] = useState("");
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);

  // Keep an applied code while moving between pages in this visit.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DISCOUNT_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setDiscount(JSON.parse(saved));
    } catch {}
  }, []);

  function saveDiscount(next: AppliedDiscount | null) {
    setDiscount(next);
    try {
      if (next) sessionStorage.setItem(DISCOUNT_STORAGE_KEY, JSON.stringify(next));
      else sessionStorage.removeItem(DISCOUNT_STORAGE_KEY);
    } catch {}
  }

  async function applyCode(event: React.FormEvent) {
    event.preventDefault();
    if (!codeInput.trim()) return;
    setCodeError(null);
    setCheckingCode(true);
    try {
      const response = await fetch("/api/discounts/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setCodeError(data.error ?? "Couldn't check that code.");
      } else {
        saveDiscount(data.discount);
        setCodeInput("");
      }
    } catch {
      setCodeError("Couldn't check that code. Please try again.");
    }
    setCheckingCode(false);
  }

  const subtotalCents = Math.round(totalPrice * 100);
  const belowMinimum = Boolean(discount?.minimumCents && subtotalCents < discount.minimumCents);
  const savingCents = discount && !belowMinimum ? discountCents(discount, subtotalCents) : 0;
  const itemsTotalCents = subtotalCents - savingCents;
  const toFreeShippingCents = FREE_SHIPPING_THRESHOLD_AUD_CENTS - itemsTotalCents;

  async function handleCheckout() {
    setError(null);
    setCheckingOut(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discountCode: discount?.code,
          items: lines.map((line) => ({
            productId: line.productId,
            color: line.color,
            size: line.size,
            customText: line.customText,
            quantity: line.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        if (data.discountError) {
          saveDiscount(null);
          setCodeError(data.error);
        } else {
          setError(data.error ?? "Something went wrong. Please try again.");
        }
        setCheckingOut(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setCheckingOut(false);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-htz-navy/50 transition-opacity ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-htz-cream shadow-2xl transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-htz-navy/10 px-6 py-4">
          <h2 className="font-display text-xl font-bold text-htz-navy">
            Your Cart ({totalItems})
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-full p-2 text-htz-navy/60 transition-colors hover:bg-htz-navy/5 hover:text-htz-navy"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {lines.length === 0 ? (
            <p className="mt-10 text-center text-htz-navy/60">
              Your cart is empty. Go grab a fidget! 🌀
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {lines.map((line) => (
                <li key={lineId(line)} className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <ProductImage product={line.product} />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Link
                      href={`/products/${line.product.id}`}
                      onClick={closeCart}
                      className="font-display font-semibold text-htz-navy hover:text-htz-orange"
                    >
                      {line.product.name}
                    </Link>
                    <span className="text-xs text-htz-navy/60">
                      {[line.color, line.size].filter(Boolean).join(" · ")}
                    </span>
                    {line.customText && (
                      <span className="text-xs text-htz-navy/60">
                        Text: &ldquo;{line.customText}&rdquo;
                      </span>
                    )}
                    <span className="text-sm text-htz-navy/60">
                      ${line.product.price.toFixed(2)} each
                    </span>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(line, line.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-htz-navy/20 text-htz-navy transition-colors hover:bg-htz-navy/5"
                        aria-label={`Decrease quantity of ${line.product.name}`}
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-semibold text-htz-navy">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line, line.quantity + 1)}
                        disabled={!canAddMore(line.productId)}
                        title={canAddMore(line.productId) ? undefined : "No more in stock"}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-htz-navy/20 text-htz-navy transition-colors hover:bg-htz-navy/5 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Increase quantity of ${line.product.name}`}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(line)}
                        className="ml-auto text-sm font-medium text-htz-pink hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="font-display font-semibold text-htz-navy">
                    ${(line.product.price * line.quantity).toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-htz-navy/10 px-6 py-4">
          {lines.length > 0 && (
            <div className="mb-3">
              {discount ? (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-htz-lime/30 px-3 py-2 text-sm">
                  <span className="text-htz-navy">
                    Code <span className="font-mono font-bold">{discount.code}</span> – {discount.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => saveDiscount(null)}
                    className="text-xs font-semibold text-htz-pink hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={applyCode} className="flex gap-2">
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="Discount code"
                    aria-label="Discount code"
                    autoCapitalize="characters"
                    className="min-w-0 flex-1 rounded-full border border-htz-navy/20 bg-white px-4 py-2 text-sm uppercase placeholder:normal-case focus:border-htz-orange focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={checkingCode || !codeInput.trim()}
                    className="rounded-full border-2 border-htz-navy/15 bg-white px-4 py-2 text-sm font-bold text-htz-navy transition-colors hover:border-htz-orange disabled:opacity-50"
                  >
                    {checkingCode ? "Checking…" : "Apply"}
                  </button>
                </form>
              )}
              {codeError && <p className="mt-1 text-xs font-semibold text-htz-pink">{codeError}</p>}
              {belowMinimum && discount?.minimumCents && (
                <p className="mt-1 text-xs text-htz-navy/60">
                  This code needs an order of at least {money(discount.minimumCents)}.
                </p>
              )}
              {discount?.firstOrderOnly && (
                <p className="mt-1 text-xs text-htz-navy/60">First order only.</p>
              )}
            </div>
          )}

          {savingCents > 0 && (
            <div className="flex items-center justify-between text-sm text-htz-navy/70">
              <span>Subtotal</span>
              <span>{money(subtotalCents)}</span>
            </div>
          )}
          {savingCents > 0 && (
            <div className="flex items-center justify-between text-sm text-htz-teal">
              <span>Discount</span>
              <span>−{money(savingCents)}</span>
            </div>
          )}
          <div className="mb-1 flex items-center justify-between font-display text-lg font-bold text-htz-navy">
            <span>Total</span>
            <span>{money(itemsTotalCents)} AUD</span>
          </div>
          {lines.length > 0 && (
            <p className="mb-3 text-xs text-htz-navy/60">
              {toFreeShippingCents > 0
                ? `Add ${money(toFreeShippingCents)} more for free shipping. `
                : "🎉 You've got free standard shipping! "}
              Shipping is added at checkout.
            </p>
          )}
          {error && <p className="mb-3 text-sm text-htz-pink">{error}</p>}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={lines.length === 0 || checkingOut}
            className="w-full rounded-full bg-htz-lime px-6 py-3 font-display text-lg font-bold text-htz-navy shadow transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checkingOut ? "Redirecting…" : "Checkout"}
          </button>
        </div>
      </aside>
    </>
  );
}
