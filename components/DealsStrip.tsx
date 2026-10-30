"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { holidayNotice, useShop } from "@/lib/shop-context";
import { FREE_SHIPPING_THRESHOLD_AUD_CENTS } from "@/lib/site";
import { SIGNUP_POINTS } from "@/lib/rewards-rules";

// Thin coloured bar above the header. Phones show one message at a time.
export default function DealsStrip() {
  const { signInEnabled, holiday, season, categories } = useShop();
  const seasonCategory = season ? categories.find((c) => c.value === season) : undefined;
  const notice = holidayNotice(holiday);
  const messages = [
    ...(season === "christmas"
      ? [{ text: "🎄 The Christmas Shop is open – gifts printed by hand!", href: seasonCategory ? `/shop?category=${season}` : "/shop" }]
      : season === "halloween"
        ? [{ text: "🎃 Spooky Halloween toys are here!", href: seasonCategory ? `/shop?category=${season}` : "/shop" }]
        : []),
    { text: `🚚 FREE shipping on orders over $${FREE_SHIPPING_THRESHOLD_AUD_CENTS / 100}`, href: "/shop" },
    ...(signInEnabled ? [{ text: `🎁 Join HugosToyz Rewards – get ${SIGNUP_POINTS} points free`, href: "/account" }] : []),
    { text: "🧩 Take the fidget quiz – find your perfect toy", href: "/quiz" },
    { text: `🛍️ Buy 3+ toys, get 10% off`, href: "/shop" },
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % messages.length), 4000);
    return () => clearInterval(timer);
  }, [messages.length]);

  if (notice) {
    return (
      <div className="bg-htz-teal px-4 py-2 text-center text-sm font-semibold text-white" role="status">
        🏖️ {notice}
      </div>
    );
  }

  return (
    <div
      className={`text-sm font-semibold text-white ${
        season === "christmas"
          ? "bg-gradient-to-r from-[#b91c1c] via-[#15803d] to-[#b91c1c]"
          : season === "halloween"
            ? "bg-gradient-to-r from-[#6d28d9] via-htz-orange to-[#6d28d9]"
            : "bg-gradient-to-r from-htz-pink via-htz-orange to-htz-pink"
      }`}
    >
      <div className="mx-auto flex max-w-7xl justify-center gap-8 px-4 py-1.5">
        {messages.map((message, i) => (
          <Link
            key={message.text}
            href={message.href}
            className={`hover:underline ${i === index % messages.length ? "block" : "hidden"} xl:block`}
          >
            {message.text}
          </Link>
        ))}
      </div>
    </div>
  );
}
