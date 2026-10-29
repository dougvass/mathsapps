"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { SEARCH_INPUT_ID } from "./ProductGrid";

const NAV_LINKS = [
  { href: "/#shop", label: "Shop" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/#about", label: "About" },
  { href: "/#faq", label: "FAQ" },
];

export default function Header() {
  const { totalItems, openCart } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-htz-navy/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/#top" className="flex items-baseline gap-2" onClick={() => setMenuOpen(false)}>
          <span className="font-display text-2xl font-bold text-white">
            Hugos<span className="text-htz-lime">Toyz</span>
          </span>
          <span className="hidden text-xs font-semibold tracking-widest text-htz-pink sm:inline">
            HTZ
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-white/80 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-htz-lime">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={`/#${SEARCH_INPUT_ID}`}
            onClick={(event) => {
              setMenuOpen(false);
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
            onClick={() => {
              setMenuOpen(false);
              openCart();
            }}
            className="relative rounded-full bg-htz-lime px-4 py-2 text-sm font-bold text-htz-navy shadow transition-transform hover:scale-105 active:scale-95"
          >
            Cart
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-htz-pink text-xs font-bold text-white">
                {totalItems}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="flex h-9 w-9 items-center justify-center rounded-full text-2xl text-white transition-colors hover:bg-white/10 sm:hidden"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-menu" className="border-t border-white/10 px-4 pb-4 sm:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block rounded-xl px-3 py-3 font-display text-lg font-semibold text-white transition-colors hover:bg-white/10 hover:text-htz-lime"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
