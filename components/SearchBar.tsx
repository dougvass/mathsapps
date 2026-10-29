"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useShop } from "@/lib/shop-context";
import { searchProducts } from "@/lib/product-search";
import ProductImage from "./ProductImage";

const MAX_SUGGESTIONS = 6;

export default function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const { products, categories } = useShop();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLFormElement>(null);

  const suggestions = query.trim()
    ? searchProducts(products, categories, query).slice(0, MAX_SUGGESTIONS)
    : [];

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function goToResults() {
    setOpen(false);
    const q = query.trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  return (
    <form
      ref={boxRef}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        if (active >= 0 && suggestions[active]) {
          setOpen(false);
          router.push(`/products/${suggestions[active].id}`);
        } else {
          goToResults();
        }
      }}
      className="relative w-full"
    >
      <input
        type="search"
        role="combobox"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, -1));
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="Search HugosToyz"
        aria-label="Search products"
        aria-autocomplete="list"
        aria-expanded={open && suggestions.length > 0}
        aria-controls="search-suggestions"
        className="h-11 w-full rounded-full border-2 border-transparent bg-white pl-4 pr-14 text-htz-navy placeholder:text-htz-navy/40 focus:border-htz-orange focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1 top-1 flex h-9 w-12 items-center justify-center rounded-full bg-htz-lime text-htz-navy transition-transform hover:scale-105"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
      </button>

      {open && suggestions.length > 0 && (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-htz-navy/10"
        >
          {suggestions.map((product, index) => (
            <li key={product.id} role="option" aria-selected={index === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => {
                  setOpen(false);
                  router.push(`/products/${product.id}`);
                }}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left ${index === active ? "bg-htz-cream" : ""}`}
              >
                <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                  <ProductImage product={product} />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-htz-navy">{product.name}</span>
                <span className="text-sm font-semibold text-htz-orange">${product.price.toFixed(2)}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={goToResults}
              className="w-full border-t border-htz-navy/10 px-3 py-2 text-left text-sm font-semibold text-htz-orange hover:bg-htz-cream"
            >
              See all results for “{query.trim()}”
            </button>
          </li>
        </ul>
      )}
    </form>
  );
}
