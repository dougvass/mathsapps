"use client";

import Link from "next/link";
import { useShop } from "@/lib/shop-context";
import { useWishlist } from "@/lib/local-lists";
import type { Product } from "@/lib/product-types";
import ProductTile from "./ProductTile";

export default function WishlistPage() {
  const { products } = useShop();
  const { ids } = useWishlist();
  const saved = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => Boolean(p));

  return (
    <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-htz-navy">♥ Your wishlist</h1>
      <p className="mt-1 text-sm text-htz-navy/60">Saved on this device. Tap the heart on any toy to add or remove it.</p>
      {saved.length === 0 ? (
        <div className="mt-6 rounded-xl bg-white p-10 text-center shadow-sm">
          <p className="text-5xl text-htz-pink" aria-hidden="true">♡</p>
          <p className="mt-3 text-htz-navy/70">Nothing saved yet.</p>
          <Link href="/shop" className="mt-4 inline-block rounded-full bg-htz-lime px-6 py-2 font-bold text-htz-navy shadow">
            Find something you love
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {saved.map((product) => (
            <li key={product.id}>
              <ProductTile product={product} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
