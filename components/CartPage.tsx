"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { lineId, useCart } from "@/lib/cart-context";
import { discountCents, type AppliedDiscount } from "@/lib/discount-lookup";
import { loadSavedDiscount, saveDiscount, startCheckout } from "@/lib/checkout-client";
import { FREE_SHIPPING_THRESHOLD_AUD_CENTS } from "@/lib/site";
import { useAccount } from "@/lib/account-context";
import { POINTS_PER_DOLLAR } from "@/lib/rewards-rules";
import ProductImage from "./ProductImage";

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CartPage() {
  const { lines, setQuantity, removeItem, canAddMore, totalItems, totalPrice } = useCart();
  const { account } = useAccount();
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [codeInput, setCodeInput] = useState("");
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDiscount(loadSavedDiscount());
  }, []);

  function updateDiscount(next: AppliedDiscount | null) {
    setDiscount(next);
    saveDiscount(next);
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
        updateDiscount(data.discount);
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
  const freeShippingProgress = Math.min(100, Math.round((itemsTotalCents / FREE_SHIPPING_THRESHOLD_AUD_CENTS) * 100));

  async function handleCheckout() {
    setError(null);
    setCheckingOut(true);
    const result = await startCheckout(lines, discount?.code);
    if ("url" in result) {
      window.location.href = result.url;
      return;
    }
    if (result.discountError) {
      updateDiscount(null);
      setCodeError(result.error);
    } else {
      setError(result.error);
    }
    setCheckingOut(false);
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-6xl" aria-hidden="true">🛒</p>
        <h1 className="mt-4 font-display text-3xl font-bold text-htz-navy">Your cart is empty</h1>
        <p className="mt-2 text-htz-navy/70">Go grab a fidget!</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-htz-lime px-8 py-3 font-display text-lg font-bold text-htz-navy shadow transition-transform hover:scale-105"
        >
          Shop all toys
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-htz-navy">
        Shopping Cart <span className="text-lg font-normal text-htz-navy/60">({totalItems} {totalItems === 1 ? "item" : "items"})</span>
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <ul className="flex flex-col divide-y divide-htz-navy/10 self-start rounded-2xl bg-white px-4 shadow-sm sm:px-6">
          {lines.map((line) => (
            <li key={lineId(line)} className="flex gap-4 py-5">
              <Link href={`/products/${line.product.id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28">
                <ProductImage product={line.product} />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/products/${line.product.id}`}
                    className="font-display text-lg font-semibold leading-tight text-htz-navy hover:text-htz-orange"
                  >
                    {line.product.name}
                  </Link>
                  <span className="font-display text-lg font-bold text-htz-navy">
                    ${(line.product.price * line.quantity).toFixed(2)}
                  </span>
                </div>
                <span className="text-sm text-htz-navy/60">
                  {[line.color, line.size].filter(Boolean).join(" · ")}
                </span>
                {line.customText && (
                  <span className="text-sm text-htz-navy/60">Text: &ldquo;{line.customText}&rdquo;</span>
                )}
                <span className="text-sm text-htz-navy/60">${line.product.price.toFixed(2)} each</span>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center rounded-full border border-htz-navy/20">
                    <button
                      type="button"
                      onClick={() => setQuantity(line, line.quantity - 1)}
                      className="h-8 w-9 rounded-l-full text-htz-navy hover:bg-htz-navy/5"
                      aria-label={`Decrease quantity of ${line.product.name}`}
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-semibold text-htz-navy">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line, line.quantity + 1)}
                      disabled={!canAddMore(line.productId)}
                      title={canAddMore(line.productId) ? undefined : "No more in stock"}
                      className="h-8 w-9 rounded-r-full text-htz-navy hover:bg-htz-navy/5 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Increase quantity of ${line.product.name}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(line)}
                    className="ml-2 text-sm font-semibold text-htz-pink hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="flex flex-col gap-4 self-start rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-36">
          {/* Free shipping progress */}
          <div>
            <p className="text-sm font-semibold text-htz-navy">
              {toFreeShippingCents > 0
                ? `Add ${money(toFreeShippingCents)} more for FREE shipping`
                : "🎉 Your order qualifies for FREE standard shipping"}
            </p>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-htz-navy/10" aria-hidden="true">
              <div
                className={`h-full rounded-full transition-all ${toFreeShippingCents > 0 ? "bg-htz-orange" : "bg-green-600"}`}
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Discount code */}
          <div>
            {discount ? (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-htz-lime/30 px-3 py-2 text-sm">
                <span className="text-htz-navy">
                  Code <span className="font-mono font-bold">{discount.code}</span> – {discount.label}
                </span>
                <button
                  type="button"
                  onClick={() => updateDiscount(null)}
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
            {discount?.firstOrderOnly && <p className="mt-1 text-xs text-htz-navy/60">First order only.</p>}
          </div>

          <dl className="flex flex-col gap-1 text-sm text-htz-navy/80">
            <div className="flex justify-between">
              <dt>Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})</dt>
              <dd>{money(subtotalCents)}</dd>
            </div>
            {savingCents > 0 && (
              <div className="flex justify-between text-htz-teal">
                <dt>Discount</dt>
                <dd>−{money(savingCents)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd>{toFreeShippingCents > 0 ? "Calculated at checkout" : "Free"}</dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-htz-navy/10 pt-2 font-display text-lg font-bold text-htz-navy">
              <dt>Total</dt>
              <dd>{money(itemsTotalCents)} AUD</dd>
            </div>
          </dl>

          {error && <p className="text-sm text-htz-pink">{error}</p>}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkingOut}
            className="w-full rounded-full bg-htz-lime px-6 py-3 font-display text-lg font-bold text-htz-navy shadow transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {checkingOut ? "Redirecting…" : "Proceed to checkout"}
          </button>
          <p className="text-center text-xs text-htz-navy/50">🔒 Secure payment by Stripe</p>
          {account ? (
            <p className="rounded-xl bg-htz-lime/20 p-2 text-center text-sm text-htz-navy">
              🎁 You&apos;ll earn <strong>{Math.floor((itemsTotalCents / 100) * POINTS_PER_DOLLAR)} points</strong> on this order
            </p>
          ) : (
            <Link href="/account" className="rounded-xl bg-htz-lime/20 p-2 text-center text-sm text-htz-navy hover:underline">
              🎁 Sign in to earn <strong>{Math.floor((itemsTotalCents / 100) * POINTS_PER_DOLLAR)} points</strong> on this order
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
