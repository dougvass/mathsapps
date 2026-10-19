"use client";

import Link from "next/link";
import type { Product, SizeOption } from "@/lib/product-types";
import ProductImage from "./ProductImage";
import StockBadge from "./StockBadge";
import ProductBadgeTag from "./ProductBadgeTag";
import AddToCartForm from "./AddToCartForm";

export default function ProductCard({
  product,
  colors,
  sizeOptions,
}: {
  product: Product;
  colors: string[];
  sizeOptions: SizeOption[];
}) {
  const href = `/products/${product.id}`;

  return (
    <div
      id={`product-${product.id}`}
      className="group relative flex scroll-mt-24 flex-col overflow-hidden rounded-3xl border-4 border-htz-navy/5 bg-white shadow-md transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <ProductBadgeTag badge={product.badge} className="absolute left-3 top-3 z-10" />
      <Link
        href={href}
        className="block aspect-square overflow-hidden transition-transform duration-300 group-hover:animate-wiggle"
        aria-label={product.name}
      >
        <ProductImage product={product} />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg font-semibold text-htz-navy">
          <Link href={href} className="hover:text-htz-orange">
            {product.name}
          </Link>
        </h3>
        <p className="flex-1 text-sm text-htz-navy/70">{product.description}</p>

        <div className="flex items-center justify-between gap-2">
          <StockBadge stock={product.stock} />
          <Link
            href={href}
            className="shrink-0 text-sm font-semibold text-htz-orange hover:underline"
          >
            View details →
          </Link>
        </div>

        <AddToCartForm product={product} colors={colors} sizeOptions={sizeOptions} />
      </div>
    </div>
  );
}
