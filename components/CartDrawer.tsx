"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import ProductImage from "./ProductImage";

export default function CartDrawer() {
  const { lines, isOpen, closeCart, setQuantity, removeItem, totalItems, totalPrice } =
    useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setError(null);
    setCheckingOut(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        setError(data.error ?? "Something went wrong. Please try again.");
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
                <li key={line.productId} className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <ProductImage product={line.product} />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="font-display font-semibold text-htz-navy">
                      {line.product.name}
                    </span>
                    <span className="text-sm text-htz-navy/60">
                      ${line.product.price.toFixed(2)} each
                    </span>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.quantity - 1)}
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
                        onClick={() => setQuantity(line.productId, line.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-htz-navy/20 text-htz-navy transition-colors hover:bg-htz-navy/5"
                        aria-label={`Increase quantity of ${line.product.name}`}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(line.productId)}
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
          <div className="mb-4 flex items-center justify-between font-display text-lg font-bold text-htz-navy">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)} AUD</span>
          </div>
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
