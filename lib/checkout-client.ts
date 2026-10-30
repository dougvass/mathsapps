"use client";

import type { AppliedDiscount } from "./discount-lookup";
import type { CartItem } from "./cart-context";

const DISCOUNT_STORAGE_KEY = "htz-discount";

// A code applied in the cart is remembered for this visit (and used by Buy Now).
export function loadSavedDiscount(): AppliedDiscount | null {
  try {
    const saved = sessionStorage.getItem(DISCOUNT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function saveDiscount(discount: AppliedDiscount | null) {
  try {
    if (discount) sessionStorage.setItem(DISCOUNT_STORAGE_KEY, JSON.stringify(discount));
    else sessionStorage.removeItem(DISCOUNT_STORAGE_KEY);
  } catch {}
}

export type CheckoutResult = { url: string } | { error: string; discountError: boolean };

export type GiftOptions = { wrap: boolean; message: string };

// Asks the server for a Stripe payment page for these items.
export async function startCheckout(
  items: CartItem[],
  discountCode?: string,
  gift?: GiftOptions
): Promise<CheckoutResult> {
  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        discountCode,
        gift,
        items: items.map(({ productId, color, size, customText, extra, quantity }) => ({
          productId,
          color,
          size,
          customText,
          extra,
          quantity,
        })),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.url) return { url: data.url };
    return {
      error: data.error ?? "Something went wrong. Please try again.",
      discountError: Boolean(data.discountError),
    };
  } catch {
    return { error: "Something went wrong. Please try again.", discountError: false };
  }
}

// "Buy Now": goes straight to payment for one item (the cart is left alone).
// A saved discount code is used if it still works, otherwise it's dropped.
export async function buyNow(item: CartItem): Promise<string | null> {
  let result = await startCheckout([item], loadSavedDiscount()?.code);
  if ("error" in result && result.discountError) {
    saveDiscount(null);
    result = await startCheckout([item]);
  }
  if ("url" in result) {
    window.location.href = result.url;
    return null;
  }
  return result.error;
}
