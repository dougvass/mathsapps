"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/local-lists";
import { useShop } from "@/lib/shop-context";
import { useAccount } from "@/lib/account-context";
import SearchBar from "./SearchBar";

// The main places to go, shown as big labelled buttons.
const MAIN_LINKS = [
  { href: "/shop", label: "Shop all", icon: "🛍️", colour: "bg-htz-lime/40" },
  { href: "/shop?category=custom", label: "Design Your Own", icon: "🎨", colour: "bg-htz-pink/15" },
  { href: "/quiz", label: "Quiz", icon: "🧩", colour: "bg-[#7c3aed]/15" },
  { href: "/deals", label: "Deals", icon: "💸", colour: "bg-htz-orange/15" },
  { href: "/help", label: "Help", icon: "❓", colour: "bg-htz-teal/10" },
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
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 gap-y-2 px-3 py-2.5 sm:flex-nowrap sm:gap-x-4 sm:px-6 lg:px-8">
          <Link href="/" onClick={close} className="flex shrink-0 items-baseline gap-2">
            <span className="font-display text-xl font-bold text-white min-[400px]:text-2xl">
              Hugos<span className="text-htz-lime">Toyz</span>
            </span>
            <span className="hidden text-xs font-semibold tracking-widest text-htz-pink lg:inline">HTZ</span>
          </Link>

          <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
            <SearchBar />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:ml-0 sm:gap-2">
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
              className="relative flex items-center gap-1.5 rounded-full bg-htz-lime px-3 py-2.5 text-base font-bold min-[400px]:px-4 text-htz-navy shadow transition-transform hover:scale-105 active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
                <path d="M2 3h3l2.5 12h12l2-8H6.2" />
              </svg>
              <span className="max-[359px]:sr-only">Cart</span>
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

      {/* Main menu, then the toy categories */}
      <nav aria-label="Main menu" className="border-b border-ink/10 bg-surface">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-3 py-2 text-sm font-bold text-ink [scrollbar-width:none] sm:px-6 sm:text-base lg:px-8">
          {MAIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 transition-transform hover:scale-105 ${link.colour}`}
            >
              <span aria-hidden="true">{link.icon}</span>
              {link.label}
            </Link>
          ))}
          <span className="mx-1 h-6 w-px shrink-0 bg-ink/15" aria-hidden="true" />
          {shownCategories
            .filter((category) => category.value !== "custom")
            .map((category) => (
              <Link
                key={category.value}
                href={`/shop?category=${encodeURIComponent(category.value)}`}
                className="shrink-0 rounded-full px-3 py-2 font-semibold text-ink/75 transition-colors hover:bg-ink/5"
              >
                {category.label}
              </Link>
            ))}
        </div>
      </nav>

      {menuOpen && (
        <nav id="mobile-menu" className="max-h-[70vh] overflow-y-auto bg-htz-navy px-4 pb-4 sm:hidden">
          {[
            ...MAIN_LINKS.map((link) => ({ href: link.href, label: `${link.icon} ${link.label}` })),
            ...(signInEnabled
              ? [{ href: "/account", label: account ? `🎁 My account · ${account.points} points` : "🎁 Sign in & earn points" }]
              : []),
            { href: "/wishlist", label: "♡ Wishlist" },
            ...shownCategories
              .filter((category) => category.value !== "custom")
              .map((category) => ({ href: `/shop?category=${encodeURIComponent(category.value)}`, label: `   ${category.label}` })),
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
