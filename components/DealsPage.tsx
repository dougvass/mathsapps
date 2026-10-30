"use client";

import Link from "next/link";
import { useShop } from "@/lib/shop-context";
import { BUNDLE_MIN_TOYS, BUNDLE_PERCENT_OFF, GIFT_WRAP_CENTS } from "@/lib/deals";
import { FREE_SHIPPING_THRESHOLD_AUD_CENTS } from "@/lib/site";
import { REDEEM_POINTS, REDEEM_VALUE_CENTS } from "@/lib/rewards-rules";
import { OPEN_WHEEL_EVENT } from "@/lib/wheel";
import ProductTile from "./ProductTile";
import { GIFT_CARD_ID } from "@/lib/product-types";

const card = "flex flex-col gap-1 rounded-2xl p-5 text-white shadow-md";

// Every way to save, in one place.
export default function DealsPage() {
  const { products, signInEnabled } = useShop();
  const onSale = products.filter((p) => p.wasPrice > p.price && p.stock !== "out-of-stock");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <h1 className="font-display text-4xl font-bold text-ink">💸 Deals</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className={`${card} bg-gradient-to-br from-htz-pink to-htz-orange`}>
          <p className="text-3xl" aria-hidden="true">🛍️</p>
          <p className="font-display text-2xl font-bold">{`Buy ${BUNDLE_MIN_TOYS}+, get ${BUNDLE_PERCENT_OFF}% off`}</p>
          <p className="text-white/90">Put any {BUNDLE_MIN_TOYS} or more toys in your cart. The discount is automatic.</p>
        </div>
        <div className={`${card} bg-gradient-to-br from-htz-teal to-htz-navy`}>
          <p className="text-3xl" aria-hidden="true">🚚</p>
          <p className="font-display text-2xl font-bold">{`Free shipping over $${FREE_SHIPPING_THRESHOLD_AUD_CENTS / 100}`}</p>
          <p className="text-white/90">Anywhere in Australia, standard post.</p>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_WHEEL_EVENT))}
          className={`${card} bg-gradient-to-br from-[#7c3aed] to-htz-pink text-left transition-transform hover:-translate-y-1`}
        >
          <p className="text-3xl" aria-hidden="true">🎡</p>
          <p className="font-display text-2xl font-bold">Spin & win</p>
          <p className="text-white/90">One free spin for a discount or free shipping. Tap to spin!</p>
        </button>
        {signInEnabled && (
          <Link href="/account" className={`${card} bg-gradient-to-br from-[#22c55e] to-htz-teal transition-transform hover:-translate-y-1`}>
            <p className="text-3xl" aria-hidden="true">🎁</p>
            <p className="font-display text-2xl font-bold">Reward points</p>
            <p className="text-white/90">{`Earn points on every order. ${REDEEM_POINTS} points = $${REDEEM_VALUE_CENTS / 100} off.`}</p>
          </Link>
        )}
        {products.some((p) => p.id === GIFT_CARD_ID) && (
          <Link href={`/products/${GIFT_CARD_ID}`} className={`${card} bg-gradient-to-br from-[#0ea5e9] to-[#7c3aed] transition-transform hover:-translate-y-1`}>
            <p className="text-3xl" aria-hidden="true">🎟️</p>
            <p className="font-display text-2xl font-bold">Gift cards</p>
            <p className="text-white/90">$10, $20 or $50 – the perfect present when you can&apos;t choose.</p>
          </Link>
        )}
        <div className={`${card} bg-gradient-to-br from-[#facc15] to-htz-orange`}>
          <p className="text-3xl" aria-hidden="true">🎀</p>
          <p className="font-display text-2xl font-bold">Gift wrap</p>
          <p className="text-white/90">{`Add gift wrap and a message in your cart for $${(GIFT_WRAP_CENTS / 100).toFixed(2)}.`}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-display text-2xl font-bold text-ink">On sale now</h2>
        {onSale.length === 0 ? (
          <p className="rounded-2xl bg-surface p-5 text-ink/70 shadow-sm">
            Nothing is on sale right now – check back soon, or <Link href="/shop" className="font-semibold text-htz-orange underline">see all toys</Link>.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {onSale.map((product) => (
              <li key={product.id}>
                <ProductTile product={product} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
