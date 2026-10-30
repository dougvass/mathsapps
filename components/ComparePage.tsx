"use client";

import Link from "next/link";
import { useCompare } from "@/lib/local-lists";
import { useShop } from "@/lib/shop-context";
import type { Product } from "@/lib/product-types";
import ProductImage from "./ProductImage";
import Stars from "./Stars";

function stockText(product: Product): string {
  if (product.stock === "out-of-stock") return "Out of stock";
  if (product.stock === "made-to-order") return "Made to order";
  return `${product.stock} in stock`;
}

// Picked toys side by side.
export default function ComparePage() {
  const { ids, toggle, clear } = useCompare();
  const { products, categories, ratings, soldCounts } = useShop();
  const picked = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => Boolean(p));

  if (picked.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-5xl" aria-hidden="true">⇄</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink">Compare toys</h1>
        <p className="mt-2 text-ink/70">Tap “⇄ Compare” on up to 3 toys in the shop to see them side by side.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-htz-lime px-6 py-3 font-bold text-htz-navy shadow">
          Go to the shop
        </Link>
      </div>
    );
  }

  const rows: { label: string; value: (p: Product) => React.ReactNode }[] = [
    { label: "Price", value: (p) => <span className="font-display text-xl font-bold">${p.price.toFixed(2)}</span> },
    {
      label: "Rating",
      value: (p) => (ratings[p.id] ? <Stars rating={ratings[p.id].average} count={ratings[p.id].count} /> : <span className="text-ink/50">No reviews yet</span>),
    },
    { label: "Type", value: (p) => categories.find((c) => c.value === p.category)?.label ?? "–" },
    { label: "Stock", value: stockText },
    { label: "Sold", value: (p) => (soldCounts[p.id] ? `${soldCounts[p.id]} sold` : "–") },
    { label: "Pick a colour", value: (p) => (p.chooseColor ? "Yes" : "No") },
    { label: "Add a name", value: (p) => (p.needsCustomText ? "Yes" : "No") },
    { label: "About", value: (p) => <span className="text-sm text-ink/75">{p.description}</span> },
  ];

  return (
    <div className="mx-auto max-w-6xl px-3 py-8 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-ink">⇄ Compare toys</h1>
        <button type="button" onClick={clear} className="text-sm font-semibold text-htz-pink hover:underline">
          Clear all
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-surface shadow-sm">
        <table className="w-full min-w-[560px] table-fixed text-left text-ink">
          <thead>
            <tr>
              <th className="w-28 p-3" />
              {picked.map((p) => (
                <th key={p.id} className="p-3 align-top">
                  <Link href={`/products/${p.id}`} className="block aspect-square overflow-hidden rounded-xl">
                    <ProductImage product={p} width={320} />
                  </Link>
                  <Link href={`/products/${p.id}`} className="mt-2 block font-display text-lg font-bold hover:text-htz-orange">
                    {p.name}
                  </Link>
                  <button type="button" onClick={() => toggle(p.id)} className="text-xs font-semibold text-htz-pink hover:underline">
                    Remove
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-ink/10">
                <th className="p-3 text-sm font-semibold text-ink/60">{row.label}</th>
                {picked.map((p) => (
                  <td key={p.id} className="p-3 align-top">
                    {row.value(p)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-ink/10">
              <th className="p-3" />
              {picked.map((p) => (
                <td key={p.id} className="p-3">
                  <Link href={`/products/${p.id}`} className="block rounded-full bg-htz-lime py-2 text-center font-bold text-htz-navy shadow">
                    See it
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
