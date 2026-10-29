"use client";

import Link from "next/link";
import type { Product } from "@/lib/product-types";
import { useCart } from "@/lib/cart-context";
import { needsOptions, useShop } from "@/lib/shop-context";
import ProductImage from "./ProductImage";
import ProductBadgeTag from "./ProductBadgeTag";
import WishlistButton from "./WishlistButton";
import Stars from "./Stars";

function stockNote(product: Product): { text: string; className: string } | null {
  if (product.stock === "out-of-stock") return { text: "Out of stock", className: "text-htz-pink" };
  if (product.stock === "made-to-order") return { text: "Made to order", className: "text-htz-navy/60" };
  if (product.stock <= 3) return { text: `Only ${product.stock} left`, className: "text-htz-orange" };
  return { text: "In stock", className: "text-green-700" };
}

// Compact shop tile: photo, name, stars, price and a quick add button.
export default function ProductTile({ product }: { product: Product }) {
  const { sizeOptions, ratings } = useShop();
  const { addItem, canAddMore } = useCart();
  const href = `/products/${product.id}`;
  const rating = ratings[product.id];
  const note = stockNote(product);
  const outOfStock = product.stock === "out-of-stock";
  const quickAdd = !needsOptions(product, sizeOptions);

  return (
    <div className="group relative flex h-full flex-col rounded-xl bg-white p-2 shadow-sm ring-1 ring-htz-navy/5 transition-shadow hover:shadow-lg sm:p-3">
      <ProductBadgeTag badge={product.badge} className="absolute left-3 top-3 z-10 !px-2 !py-0.5 text-[10px] sm:left-4 sm:top-4" />
      <WishlistButton
        productId={product.id}
        productName={product.name}
        className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4"
      />
      <Link href={href} className="block aspect-square overflow-hidden rounded-lg" aria-label={product.name}>
        <div className="h-full w-full transition-transform duration-300 group-hover:scale-105">
          <ProductImage product={product} />
        </div>
      </Link>
      <div className="mt-2 flex flex-1 flex-col gap-1">
        <Link
          href={href}
          className="line-clamp-2 text-sm font-semibold leading-snug text-htz-navy hover:text-htz-orange sm:text-base"
        >
          {product.name}
        </Link>
        {rating && <Stars rating={rating.average} count={rating.count} />}
        <p className="font-display text-lg font-bold text-htz-navy sm:text-xl">
          <span className="align-top text-xs">$</span>
          {product.price.toFixed(2)}
        </p>
        {note && <p className={`text-xs font-semibold ${note.className}`}>{note.text}</p>}
        <div className="mt-auto pt-2">
          {outOfStock ? (
            <Link
              href={href}
              className="block w-full rounded-full border border-htz-navy/15 py-1.5 text-center text-sm font-semibold text-htz-navy/60"
            >
              See details
            </Link>
          ) : quickAdd ? (
            <button
              type="button"
              disabled={!canAddMore(product.id)}
              title={canAddMore(product.id) ? undefined : "All available stock is in your cart"}
              onClick={() =>
                addItem({ productId: product.id, color: "", size: sizeOptions[0]?.label ?? "", customText: "" })
              }
              className="w-full rounded-full bg-htz-lime py-1.5 text-sm font-bold text-htz-navy shadow-sm transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add to Cart
            </button>
          ) : (
            <Link
              href={href}
              className="block w-full rounded-full bg-htz-lime py-1.5 text-center text-sm font-bold text-htz-navy shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
            >
              Choose options
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
