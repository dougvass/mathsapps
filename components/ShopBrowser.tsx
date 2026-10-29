"use client";

import { useEffect, useState } from "react";
import { useShop } from "@/lib/shop-context";
import { searchProducts } from "@/lib/product-search";
import type { Product } from "@/lib/product-types";
import ProductTile from "./ProductTile";

export const SORTS = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  newest: "Newest arrivals",
  top: "Top rated",
} as const;
export type SortKey = keyof typeof SORTS;

export const PRICES = {
  under10: { label: "Under $10", test: (p: number) => p < 10 },
  "10to20": { label: "$10 to $20", test: (p: number) => p >= 10 && p <= 20 },
  over20: { label: "Over $20", test: (p: number) => p > 20 },
} as const;
export type PriceKey = keyof typeof PRICES;

export type ShopFilters = {
  q: string;
  category: string;
  price: PriceKey | "";
  inStock: boolean;
  sort: SortKey;
};

// Products added in the admin have ids like "product-1712345678901".
function addedAt(product: Product): number {
  const match = product.id.match(/-(\d{12,})$/);
  return match ? Number(match[1]) : 0;
}

function toQuery(filters: ShopFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.price) params.set("price", filters.price);
  if (filters.inStock) params.set("stock", "1");
  if (filters.sort !== "featured") params.set("sort", filters.sort);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export default function ShopBrowser({ initial }: { initial: ShopFilters }) {
  const { products, categories, ratings } = useShop();
  const [filters, setFilters] = useState(initial);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Header search and category links navigate here with new URL params.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters(initial);
  }, [initial]);

  function update(changes: Partial<ShopFilters>) {
    const next = { ...filters, ...changes };
    setFilters(next);
    window.history.replaceState(null, "", `/shop${toQuery(next)}`);
  }

  let visible = searchProducts(products, categories, filters.q);
  if (filters.category) visible = visible.filter((p) => p.category === filters.category);
  if (filters.price) visible = visible.filter((p) => PRICES[filters.price as PriceKey].test(p.price));
  if (filters.inStock) visible = visible.filter((p) => p.stock !== "out-of-stock");

  const order = new Map(products.map((p, i) => [p.id, i]));
  visible = [...visible].sort((a, b) => {
    switch (filters.sort) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "newest":
        return addedAt(b) - addedAt(a) || order.get(b.id)! - order.get(a.id)!;
      case "top":
        return (
          (ratings[b.id]?.average ?? 0) - (ratings[a.id]?.average ?? 0) ||
          (ratings[b.id]?.count ?? 0) - (ratings[a.id]?.count ?? 0) ||
          Number(b.badge === "bestseller") - Number(a.badge === "bestseller")
        );
      default:
        return order.get(a.id)! - order.get(b.id)!;
    }
  });

  const categoryLabel = categories.find((c) => c.value === filters.category)?.label;
  const heading = filters.q
    ? `Results for “${filters.q}”`
    : (categoryLabel ?? "All toys");
  const activeCount = [filters.category, filters.price, filters.inStock].filter(Boolean).length;

  // Rendered twice (sidebar and phone drawer), so radio groups need separate names.
  const filterPanel = (place: string) => (
    <div className="flex flex-col gap-6 text-sm">
      <fieldset>
        <legend className="mb-2 font-display text-base font-bold text-htz-navy">Category</legend>
        <ul className="flex flex-col gap-1">
          {[{ value: "", label: "All toys" }, ...categories].map((category) => (
            <li key={category.value}>
              <button
                type="button"
                onClick={() => update({ category: category.value })}
                aria-pressed={filters.category === category.value}
                className={`text-left hover:text-htz-orange ${filters.category === category.value ? "font-bold text-htz-orange" : "text-htz-navy/80"}`}
              >
                {category.label}
              </button>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-display text-base font-bold text-htz-navy">Price</legend>
        <ul className="flex flex-col gap-1">
          {(Object.keys(PRICES) as PriceKey[]).map((key) => (
            <li key={key}>
              <label className="flex cursor-pointer items-center gap-2 text-htz-navy/80">
                <input
                  type="radio"
                  name={`price-${place}`}
                  checked={filters.price === key}
                  onChange={() => update({ price: key })}
                  className="accent-htz-orange"
                />
                {PRICES[key].label}
              </label>
            </li>
          ))}
          {filters.price && (
            <li>
              <button type="button" onClick={() => update({ price: "" })} className="text-xs text-htz-teal hover:underline">
                Any price
              </button>
            </li>
          )}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-display text-base font-bold text-htz-navy">Availability</legend>
        <label className="flex cursor-pointer items-center gap-2 text-htz-navy/80">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => update({ inStock: e.target.checked })}
            className="accent-htz-orange"
          />
          Hide out of stock
        </label>
      </fieldset>

      {(activeCount > 0 || filters.q) && (
        <button
          type="button"
          onClick={() => update({ q: "", category: "", price: "", inStock: false })}
          className="self-start rounded-full border border-htz-navy/20 px-4 py-1.5 font-semibold text-htz-navy hover:border-htz-orange"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
        <div>
          <h1 className="font-display text-xl font-bold text-htz-navy sm:text-2xl">{heading}</h1>
          <p className="text-sm text-htz-navy/60" aria-live="polite">
            {visible.length} {visible.length === 1 ? "toy" : "toys"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="rounded-full border border-htz-navy/20 bg-white px-4 py-2 text-sm font-semibold text-htz-navy lg:hidden"
          >
            Filters{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
          <label className="flex items-center gap-2 text-sm text-htz-navy/70">
            <span className="hidden sm:inline">Sort by</span>
            <select
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value as SortKey })}
              aria-label="Sort by"
              className="rounded-full border border-htz-navy/20 bg-htz-cream px-3 py-2 text-sm font-semibold text-htz-navy focus:border-htz-orange focus:outline-none"
            >
              {(Object.keys(SORTS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORTS[key]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="hidden self-start rounded-xl bg-white p-5 shadow-sm lg:sticky lg:top-36 lg:block" aria-label="Filters">
          {filterPanel("side")}
        </aside>

        {visible.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <p className="text-5xl" aria-hidden="true">🔍</p>
            <p className="mt-3 text-htz-navy/70">No toys match. Try a different word or clear the filters.</p>
            <button
              type="button"
              onClick={() => update({ q: "", category: "", price: "", inStock: false })}
              className="mt-4 rounded-full bg-htz-lime px-6 py-2 font-bold text-htz-navy shadow"
            >
              See everything
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {visible.map((product) => (
              <li key={product.id}>
                <ProductTile product={product} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85%] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-htz-navy px-5 py-4 text-white">
              <span className="font-display text-lg font-bold">Filters</span>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="text-2xl">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{filterPanel("drawer")}</div>
            <div className="border-t border-htz-navy/10 p-4">
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="w-full rounded-full bg-htz-lime py-2.5 font-bold text-htz-navy shadow"
              >
                Show {visible.length} {visible.length === 1 ? "toy" : "toys"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
