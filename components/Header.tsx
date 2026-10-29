"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/local-lists";
import { useShop } from "@/lib/shop-context";
import { useAccount } from "@/lib/account-context";
import SearchBar from "./SearchBar";

const PAGE_LINKS = [
  { href: "/account", label: "🎁 Rewards" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/#about", label: "About" },
  { href: "/#faq", label: "FAQ" },
];

function CountBubble({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-htz-pink px-1 text-[11px] font-bold text-white">
      {count}
    </span>
  );
}

export default function Header() {
  const { totalItems } = useCart();
  const { ids: wishlist } = useWishlist();
  const { products, categories, signInEnabled } = useShop();
  const { account } = useAccount();
  const firstName = account?.name.split(" ")[0];
  const [menuOpen, setMenuOpen] = useState(false);
  const shownCategories = categories.filter((c) => products.some((p) => p.category === c.value));

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 shadow-md">
      <div className="bg-htz-navy">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:flex-nowrap sm:px-6 lg:px-8">
          <Link href="/" onClick={close} className="flex shrink-0 items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-white">
              Hugos<span className="text-htz-lime">Toyz</span>
            </span>
            <span className="hidden text-xs font-semibold tracking-widest text-htz-pink lg:inline">HTZ</span>
          </Link>

          <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
            <SearchBar />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0 sm:gap-2">
            {signInEnabled && (
            <Link
              href="/account"
              onClick={close}
              aria-label={account ? `Your account, ${account.points} points` : "Sign in"}
              className="flex h-10 items-center gap-1 rounded-full px-2 text-white transition-colors hover:bg-white/10"
            >
              <span className="text-xl sm:hidden" aria-hidden="true">👤</span>
              <span className="hidden flex-col leading-tight sm:flex">
                <span className="text-[11px] text-white/70">{account ? `Hi, ${firstName}` : "Hello, sign in"}</span>
                <span className="text-sm font-bold">{account ? `${account.points} points` : "Account & Rewards"}</span>
              </span>
            </Link>
            )}
            <Link
              href="/wishlist"
              onClick={close}
              aria-label={`Wishlist (${wishlist.length})`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-xl text-white transition-colors hover:bg-white/10"
            >
              ♡
              <CountBubble count={wishlist.length} />
            </Link>
            <Link
              href="/cart"
              onClick={close}
              className="relative flex items-center gap-1.5 rounded-full bg-htz-lime px-4 py-2.5 text-base font-bold text-htz-navy shadow transition-transform hover:scale-105 active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
                <path d="M2 3h3l2.5 12h12l2-8H6.2" />
              </svg>
              Cart
              <CountBubble count={totalItems} />
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="flex h-10 w-10 items-center justify-center rounded-full text-2xl text-white transition-colors hover:bg-white/10 sm:hidden"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {/* Category strip */}
      <nav aria-label="Categories" className="border-b border-ink/10 bg-surface">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 py-2 text-base font-semibold text-ink [scrollbar-width:none] sm:px-6 lg:px-8">
          <Link href="/shop" className="shrink-0 rounded-full px-3 py-1.5 transition-colors hover:bg-ink/5">
            All toys
          </Link>
          {shownCategories.map((category) => (
            <Link
              key={category.value}
              href={`/shop?category=${encodeURIComponent(category.value)}`}
              className="shrink-0 rounded-full px-3 py-1.5 transition-colors hover:bg-ink/5"
            >
              {category.label}
            </Link>
          ))}
          <span className="mx-1 hidden w-px shrink-0 bg-ink/10 sm:block" aria-hidden="true" />
          {PAGE_LINKS.filter((link) => signInEnabled || link.href !== "/account").map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hidden shrink-0 rounded-full px-3 py-1 text-ink/70 transition-colors hover:bg-ink/5 sm:block"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {menuOpen && (
        <nav id="mobile-menu" className="max-h-[70vh] overflow-y-auto bg-htz-navy px-4 pb-4 sm:hidden">
          {[
            { href: "/shop", label: "Shop all toys" },
            ...(signInEnabled
              ? [{ href: "/account", label: account ? `My account · ${account.points} points` : "Sign in & earn points" }]
              : []),
            { href: "/wishlist", label: "Wishlist ♡" },
            ...PAGE_LINKS.filter((link) => link.href !== "/account"),
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
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
