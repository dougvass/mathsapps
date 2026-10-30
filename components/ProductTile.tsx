"use client";

import Link from "next/link";
import type { Product } from "@/lib/product-types";
import { useCart } from "@/lib/cart-context";
import { needsOptions, SHOW_SOLD_FROM, useShop } from "@/lib/shop-context";
import { FILE_PRINT_ID } from "@/lib/product-types";
import ProductImage from "./ProductImage";
import ProductBadgeTag from "./ProductBadgeTag";
import WishlistButton from "./WishlistButton";
import Stars from "./Stars";
import BuyNowButton from "./BuyNowButton";

function stockNote(product: Product): { text: string; className: string } | null {
  if (product.stock === "out-of-stock") return { text: "Out of stock", className: "text-htz-pink" };
  if (product.stock === "made-to-order") return { text: "Made to order", className: "text-ink/60" };
  if (product.stock <= 3) return { text: `Only ${product.stock} left`, className: "text-htz-orange" };
  return { text: "In stock", className: "text-green-700" };
}

// Compact shop tile: photo, name, stars, price and a quick add button.
export default function ProductTile({ product }: { product: Product }) {
  const { sizeOptions, ratings, soldCounts } = useShop();
  const sold = soldCounts[product.id] ?? 0;
  const { addItem, canAddMore } = useCart();
  const href = `/products/${product.id}`;
  const rating = ratings[product.id];
  const note = stockNote(product);
  const outOfStock = product.stock === "out-of-stock";
  const quickAdd = !needsOptions(product, sizeOptions);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-ink/5 transition-shadow hover:shadow-lg">
      <ProductBadgeTag badge={product.badge} className="absolute left-2 top-2 z-10 !px-2 !py-0.5 text-[11px]" />
      <WishlistButton
        productId={product.id}
        productName={product.name}
        className="absolute right-2 top-2 z-10 h-10 w-10"
      />
      <Link href={href} className="block aspect-square overflow-hidden" aria-label={product.name}>
        <div className="h-full w-full transition-transform duration-300 group-hover:scale-105">
          <ProductImage product={product} width={640} />
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link
          href={href}
          className="line-clamp-2 text-base font-semibold leading-snug text-ink hover:text-htz-orange"
        >
          {product.name}
        </Link>
        {rating && <Stars rating={rating.average} count={rating.count} />}
        <p className="font-display text-xl font-bold text-ink sm:text-2xl">
          {product.id === FILE_PRINT_ID && <span className="mr-1 text-sm font-semibold text-ink/60">From</span>}
          <span className="align-top text-xs">$</span>
          {product.price.toFixed(2)}
          {product.wasPrice > product.price && (
            <span className="ml-2 text-sm font-normal text-ink/50 line-through">${product.wasPrice.toFixed(2)}</span>
          )}
        </p>
        {product.wasPrice > product.price && (
          <p className="self-start rounded-md bg-htz-pink px-2 py-0.5 text-xs font-bold text-white">
            {Math.round((1 - product.price / product.wasPrice) * 100)}% off
          </p>
        )}
        {sold >= SHOW_SOLD_FROM && <p className="text-xs font-semibold text-htz-orange">🔥 {sold} sold</p>}
        {note && <p className={`text-sm font-semibold ${note.className}`}>{note.text}</p>}
        <div className="mt-auto pt-2">
          {outOfStock ? (
            <Link
              href={href}
              className="block w-full rounded-full border border-ink/15 py-2.5 text-center text-base font-semibold text-ink/60"
            >
              See details
            </Link>
          ) : product.id === FILE_PRINT_ID ? (
            <Link
              href={href}
              className="block w-full rounded-full bg-htz-lime py-2.5 text-center text-base font-bold text-htz-navy shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
            >
              Upload file
            </Link>
          ) : quickAdd ? (
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                disabled={!canAddMore(product.id)}
                title={canAddMore(product.id) ? undefined : "All available stock is in your cart"}
                onClick={() =>
                  addItem({ productId: product.id, color: "", size: sizeOptions[0]?.label ?? "", customText: "" })
                }
                className="w-full rounded-full bg-htz-lime py-2.5 text-base font-bold text-htz-navy shadow-sm transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add to Cart
              </button>
              <BuyNowButton
                item={() => ({ productId: product.id, color: "", size: sizeOptions[0]?.label ?? "", customText: "", quantity: 1 })}
                className="w-full py-2 text-sm"
              />
            </div>
          ) : (
            <Link
              href={href}
              className="block w-full rounded-full bg-htz-lime py-2.5 text-center text-base font-bold text-htz-navy shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
            >
              Choose options
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
