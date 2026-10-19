"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { SEARCH_INPUT_ID } from "./ProductGrid";

export default function Header() {
  const { totalItems, openCart } = useCart();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-htz-navy/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/#top" className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold text-white">
            Hugos<span className="text-htz-lime">Toyz</span>
          </span>
          <span className="hidden text-xs font-semibold tracking-widest text-htz-pink sm:inline">
            HTZ
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-white/80 sm:flex">
          <Link href="/#shop" className="transition-colors hover:text-htz-lime">
            Shop
          </Link>
          <Link href="/#about" className="transition-colors hover:text-htz-lime">
            About
          </Link>
          <Link href="/#faq" className="transition-colors hover:text-htz-lime">
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-2">
        <Link
          href={`/#${SEARCH_INPUT_ID}`}
          onClick={(event) => {
            if (pathname !== "/") return;
            event.preventDefault();
            const box = document.getElementById(SEARCH_INPUT_ID);
            box?.scrollIntoView({ behavior: "smooth", block: "start" });
            box?.querySelector("input")?.focus({ preventScroll: true });
          }}
          aria-label="Search products"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-htz-lime"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
        </Link>
        <button
          type="button"
          onClick={openCart}
          className="relative rounded-full bg-htz-lime px-4 py-2 text-sm font-bold text-htz-navy shadow transition-transform hover:scale-105 active:scale-95"
        >
          Cart
          {totalItems > 0 && (
            <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-htz-pink text-xs font-bold text-white">
              {totalItems}
            </span>
          )}
        </button>
        </div>
      </div>
    </header>
  );
}
