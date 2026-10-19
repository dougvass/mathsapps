"use client";

import { useEffect, useRef, useState } from "react";
import { BADGE_LABELS, type CategoryDef, type Product, type SizeOption } from "@/lib/product-types";
import ProductCard from "./ProductCard";

export const SEARCH_INPUT_ID = "shop-search";

function matches(product: Product, categoryLabel: string, terms: string[]): boolean {
  const haystack = [
    product.name,
    product.description,
    categoryLabel,
    product.badge ? BADGE_LABELS[product.badge] : "",
  ]
    .join(" ")
    .toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export default function ProductGrid({
  products,
  categories,
  colors,
  sizeOptions,
}: {
  products: Product[];
  categories: CategoryDef[];
  colors: string[];
  sizeOptions: SizeOption[];
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // The header's search icon links to #shop-search; focus the box when it's used.
  useEffect(() => {
    function focusIfTargeted() {
      if (window.location.hash === `#${SEARCH_INPUT_ID}`) {
        inputRef.current?.focus({ preventScroll: true });
      }
    }
    focusIfTargeted();
    window.addEventListener("hashchange", focusIfTargeted);
    return () => window.removeEventListener("hashchange", focusIfTargeted);
  }, []);

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const labelFor = (value: string) => categories.find((c) => c.value === value)?.label ?? "";
  const visible =
    terms.length === 0
      ? products
      : products.filter((product) => matches(product, labelFor(product.category), terms));

  return (
    <section id="shop" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold text-htz-navy sm:text-4xl">
          Shop the Fidget Lineup
        </h2>
        <p className="mt-3 text-htz-navy/70">
          3D-printed, hand-finished, and made for busy hands. Pick a favourite
          or grab a few.
        </p>

        <div className="relative mx-auto mt-6 max-w-md scroll-mt-24" id={SEARCH_INPUT_ID}>
          <span
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-htz-navy/40"
            aria-hidden="true"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search toys, e.g. dragon or keychain"
            aria-label="Search products"
            className="w-full rounded-full border-2 border-htz-navy/10 bg-white py-3 pl-11 pr-11 text-htz-navy shadow-sm focus:border-htz-orange focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-htz-navy/50 hover:bg-htz-navy/5 hover:text-htz-navy"
            >
              ✕
            </button>
          )}
        </div>

        {terms.length > 0 && (
          <p className="mt-3 text-sm text-htz-navy/60" aria-live="polite">
            {visible.length === 0
              ? "No toys match your search."
              : `${visible.length} ${visible.length === 1 ? "toy matches" : "toys match"} “${query.trim()}”`}
          </p>
        )}
      </div>

      {visible.length === 0 && terms.length > 0 ? (
        <div className="text-center">
          <p className="text-4xl" aria-hidden="true">🔍</p>
          <p className="mt-2 text-htz-navy/70">
            Try a different word, or{" "}
            <button
              type="button"
              onClick={() => setQuery("")}
              className="font-semibold text-htz-orange hover:underline"
            >
              see everything
            </button>
            .
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-14">
          {categories.map((category) => {
            const items = visible.filter((product) => product.category === category.value);
            if (items.length === 0) return null;

            return (
              <div key={category.value}>
                <h3 className="font-display mb-6 text-2xl font-semibold text-htz-navy">
                  {category.label}
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      colors={colors}
                      sizeOptions={sizeOptions}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
