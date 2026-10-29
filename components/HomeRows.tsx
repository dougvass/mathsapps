"use client";

import Link from "next/link";
import { useShop } from "@/lib/shop-context";
import type { Product } from "@/lib/product-types";
import ProductRow from "./ProductRow";
import { sizedImage } from "./ProductImage";
import ToyOfWeekBanner from "./ToyOfWeekBanner";
import { MYSTERY_BAG_ID, type ToyOfWeek } from "@/lib/product-types";

// Colourful backgrounds for the category cards, in turn.
const CARD_COLOURS = [
  "from-htz-orange to-htz-pink",
  "from-htz-teal to-[#1f8a8a]",
  "from-htz-pink to-[#a855f7]",
  "from-[#facc15] to-htz-orange",
  "from-[#22c55e] to-htz-teal",
];

// Homepage: category cards, then two shelves and a button to see everything.
export default function HomeRows({ toyOfWeek }: { toyOfWeek: ToyOfWeek }) {
  const { products, categories } = useShop();
  const inStockFirst = (list: Product[]) =>
    [...list].sort((a, b) => Number(a.stock === "out-of-stock") - Number(b.stock === "out-of-stock"));

  const bestsellers = inStockFirst(products.filter((p) => p.badge === "bestseller"));
  const fresh = inStockFirst(products.filter((p) => p.badge === "new"));
  // If nothing is tagged yet, show a few toys so the homepage isn't empty.
  const popular = bestsellers.length > 0 ? bestsellers : inStockFirst(products).slice(0, 8);

  const shownCategories = categories.filter((c) => products.some((p) => p.category === c.value));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-3 py-8 sm:px-6 lg:px-8">
      <ToyOfWeekBanner pick={toyOfWeek} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {shownCategories.map((category, i) => {
          const sample = products.find((p) => p.category === category.value && p.image);
          return (
            <Link
              key={category.value}
              href={`/shop?category=${encodeURIComponent(category.value)}`}
              className={`group flex flex-col rounded-2xl bg-gradient-to-br p-3 text-white shadow-md transition-transform hover:-translate-y-1 hover:shadow-xl ${CARD_COLOURS[i % CARD_COLOURS.length]}`}
            >
              <span className="font-display text-lg font-bold drop-shadow-sm">{category.label}</span>
              <span className="mt-2 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-white/90 text-6xl">
                {sample ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sizedImage(sample.image, 320)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <span aria-hidden="true">{products.find((p) => p.category === category.value)?.emoji ?? "🧩"}</span>
                )}
              </span>
              <span className="mt-2 text-sm font-bold">Shop now →</span>
            </Link>
          );
        })}
      </div>

      <ProductRow title="⭐ Bestsellers" products={popular} seeAllHref="/shop?sort=top" tint="orange" />
      <ProductRow title="🆕 New arrivals" products={fresh} seeAllHref="/shop?sort=newest" tint="lime" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/quiz" className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-htz-teal to-htz-navy p-5 text-white shadow-md transition-transform hover:-translate-y-1">
          <span className="text-5xl" aria-hidden="true">🧩</span>
          <span>
            <span className="block font-display text-xl font-bold">Not sure what to get?</span>
            <span className="text-white/80">Take the 3-question fidget quiz →</span>
          </span>
        </Link>
        {products.some((p) => p.id === MYSTERY_BAG_ID) && (
        <Link href={`/products/${MYSTERY_BAG_ID}`} className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-htz-pink to-[#a855f7] p-5 text-white shadow-md transition-transform hover:-translate-y-1">
          <span className="text-5xl" aria-hidden="true">🎁</span>
          <span>
            <span className="block font-display text-xl font-bold">Mystery Bag</span>
            <span className="text-white/80">Pick what you like, we pack a surprise →</span>
          </span>
        </Link>
        )}
      </div>

      <Link
        href="/shop"
        className="mx-auto rounded-full bg-htz-navy px-10 py-4 font-display text-xl font-bold text-htz-lime shadow-lg transition-transform hover:scale-105"
      >
        See all {products.length} toys →
      </Link>
    </div>
  );
}
