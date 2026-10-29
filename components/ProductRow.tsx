"use client";

import Link from "next/link";
import type { Product } from "@/lib/product-types";
import ProductTile from "./ProductTile";

const TINTS = {
  white: "bg-surface",
  orange: "tint-orange",
  lime: "tint-lime",
};

// A titled row of tiles that scrolls sideways, like a shop shelf.
export default function ProductRow({
  title,
  products,
  seeAllHref,
  tint = "white",
}: {
  title: string;
  products: Product[];
  seeAllHref?: string;
  tint?: keyof typeof TINTS;
}) {
  if (products.length === 0) return null;
  return (
    <section className={`rounded-2xl p-4 shadow-sm sm:p-5 ${TINTS[tint]}`}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">{title}</h2>
        {seeAllHref && (
          <Link href={seeAllHref} className="shrink-0 text-sm font-semibold text-accent hover:text-htz-orange hover:underline">
            See all
          </Link>
        )}
      </div>
      <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {products.map((product) => (
          <li key={product.id} className="w-44 shrink-0 snap-start sm:w-56">
            <ProductTile product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
