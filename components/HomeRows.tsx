"use client";

import Link from "next/link";
import { useShop } from "@/lib/shop-context";
import { useRecentlyViewed } from "@/lib/local-lists";
import type { Product } from "@/lib/product-types";
import ProductRow from "./ProductRow";

const BUDGET_PRICE = 10;

// Homepage shelves: bestsellers, new, budget, top rated, and what you looked at.
export default function HomeRows() {
  const { products, categories, ratings } = useShop();
  const { ids: recentIds } = useRecentlyViewed();
  const inStockFirst = (list: Product[]) =>
    [...list].sort((a, b) => Number(a.stock === "out-of-stock") - Number(b.stock === "out-of-stock"));

  const bestsellers = inStockFirst(products.filter((p) => p.badge === "bestseller"));
  const fresh = inStockFirst(products.filter((p) => p.badge === "new"));
  const budget = inStockFirst(products.filter((p) => p.price < BUDGET_PRICE));
  const topRated = products
    .filter((p) => ratings[p.id])
    .sort((a, b) => ratings[b.id].average - ratings[a.id].average || ratings[b.id].count - ratings[a.id].count);
  const recent = recentIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const shownCategories = categories.filter((c) => products.some((p) => p.category === c.value));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-3 py-6 sm:px-6 lg:px-8">
      {/* Category cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {shownCategories.map((category) => {
          const sample = products.find((p) => p.category === category.value && p.image);
          return (
            <Link
              key={category.value}
              href={`/shop?category=${encodeURIComponent(category.value)}`}
              className="group flex flex-col rounded-2xl bg-white p-3 shadow-sm transition-shadow hover:shadow-lg"
            >
              <span className="font-display text-base font-bold text-htz-navy sm:text-lg">{category.label}</span>
              <span className="mt-2 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-htz-cream text-5xl">
                {sample ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sample.image} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <span aria-hidden="true">{products.find((p) => p.category === category.value)?.emoji ?? "🧩"}</span>
                )}
              </span>
              <span className="mt-2 text-sm font-semibold text-htz-teal group-hover:text-htz-orange">Shop now →</span>
            </Link>
          );
        })}
        <Link
          href="/shop"
          className="group flex flex-col justify-center rounded-2xl bg-htz-navy p-4 text-white shadow-sm transition-shadow hover:shadow-lg"
        >
          <span className="font-display text-lg font-bold">All toys</span>
          <span className="text-sm text-white/70">{products.length} to choose from</span>
          <span className="mt-3 text-sm font-semibold text-htz-lime group-hover:underline">Browse everything →</span>
        </Link>
      </div>

      <ProductRow title="⭐ Bestsellers" products={bestsellers} seeAllHref="/shop?sort=top" />
      <ProductRow title="🆕 New arrivals" products={fresh} seeAllHref="/shop?sort=newest" />
      <ProductRow title={`💸 Under $${BUDGET_PRICE}`} products={budget} seeAllHref="/shop?price=under10" />
      <ProductRow title="🏆 Top rated" products={topRated} seeAllHref="/shop?sort=top" />
      {shownCategories.map((category) => (
        <ProductRow
          key={category.value}
          title={category.label}
          products={inStockFirst(products.filter((p) => p.category === category.value))}
          seeAllHref={`/shop?category=${encodeURIComponent(category.value)}`}
        />
      ))}
      <ProductRow title="👀 Your recently viewed" products={recent} />
    </div>
  );
}
