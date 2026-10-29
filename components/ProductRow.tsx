"use client";

import Link from "next/link";
import type { Product } from "@/lib/product-types";
import ProductTile from "./ProductTile";

// A titled row of tiles that scrolls sideways, like a shop shelf.
export default function ProductRow({
  title,
  products,
  seeAllHref,
}: {
  title: string;
  products: Product[];
  seeAllHref?: string;
}) {
  if (products.length === 0) return null;
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-htz-navy sm:text-2xl">{title}</h2>
        {seeAllHref && (
          <Link href={seeAllHref} className="shrink-0 text-sm font-semibold text-htz-teal hover:text-htz-orange hover:underline">
            See all
          </Link>
        )}
      </div>
      <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {products.map((product) => (
          <li key={product.id} className="w-40 shrink-0 snap-start sm:w-48">
            <ProductTile product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
