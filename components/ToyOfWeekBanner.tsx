"use client";

import Link from "next/link";
import type { ToyOfWeek } from "@/lib/product-types";
import { useShop } from "@/lib/shop-context";
import ProductImage from "./ProductImage";

// The admin's pick of the week, in a big spotlight.
export default function ToyOfWeekBanner({ pick }: { pick: ToyOfWeek }) {
  const { products } = useShop();
  const product = products.find((p) => p.id === pick.productId);
  if (!product) return null;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group grid overflow-hidden rounded-3xl bg-gradient-to-br from-[#facc15] via-htz-orange to-htz-pink text-white shadow-lg transition-transform hover:-translate-y-1 sm:grid-cols-[280px_1fr]"
    >
      <div className="aspect-square overflow-hidden sm:aspect-auto">
        <div className="h-full w-full transition-transform duration-300 group-hover:scale-105">
          <ProductImage product={product} width={640} />
        </div>
      </div>
      <div className="flex flex-col justify-center gap-2 p-6">
        <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-white/90">🌟 Toy of the Week</p>
        <p className="font-display text-3xl font-bold drop-shadow-sm sm:text-4xl">{product.name}</p>
        <p className="text-white/90 sm:text-lg">{pick.blurb || product.description}</p>
        <p className="mt-2 flex items-center gap-3">
          <span className="font-display text-2xl font-bold">${product.price.toFixed(2)}</span>
          <span className="rounded-full bg-white px-5 py-2 font-bold text-htz-orange shadow group-hover:scale-105">See it →</span>
        </p>
      </div>
    </Link>
  );
}
