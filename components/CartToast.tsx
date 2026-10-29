"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useShop } from "@/lib/shop-context";
import ProductImage from "./ProductImage";

// "Added to cart" pop-up shown after adding something.
export default function CartToast() {
  const { lastAdded, dismissAdded, totalItems } = useCart();
  const { products } = useShop();
  const product = lastAdded ? products.find((p) => p.id === lastAdded.key.productId) : null;

  useEffect(() => {
    if (!lastAdded) return;
    const timer = setTimeout(dismissAdded, 5000);
    return () => clearTimeout(timer);
  }, [lastAdded, dismissAdded]);

  if (!lastAdded || !product) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-htz-navy/10 sm:inset-x-auto sm:right-4 sm:top-24 sm:bottom-auto"
    >
      <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
        <ProductImage product={product} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-green-700">✓ Added to cart</p>
        <p className="truncate text-sm text-htz-navy">
          {lastAdded.quantity > 1 ? `${lastAdded.quantity} × ` : ""}
          {product.name}
        </p>
        <p className="text-xs text-htz-navy/60">
          {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Link
          href="/cart"
          onClick={dismissAdded}
          className="rounded-full bg-htz-lime px-4 py-1.5 text-sm font-bold text-htz-navy shadow"
        >
          View cart
        </Link>
        <button type="button" onClick={dismissAdded} className="text-xs text-htz-navy/50 hover:underline">
          Keep shopping
        </button>
      </div>
    </div>
  );
}
