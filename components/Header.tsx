"use client";

import { useCart } from "@/lib/cart-context";

export default function Header() {
  const { totalItems, openCart } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-htz-navy/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold text-white">
            Hugos<span className="text-htz-lime">Toyz</span>
          </span>
          <span className="hidden text-xs font-semibold tracking-widest text-htz-pink sm:inline">
            HTZ
          </span>
        </a>

        <nav className="hidden items-center gap-6 text-sm font-medium text-white/80 sm:flex">
          <a href="#shop" className="transition-colors hover:text-htz-lime">
            Shop
          </a>
          <a href="#about" className="transition-colors hover:text-htz-lime">
            About
          </a>
          <a href="#footer" className="transition-colors hover:text-htz-lime">
            Contact
          </a>
        </nav>

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
    </header>
  );
}
