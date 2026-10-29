"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useShop } from "@/lib/shop-context";
import { FREE_SHIPPING_THRESHOLD_AUD_CENTS } from "@/lib/site";
import { SIGNUP_POINTS } from "@/lib/rewards-rules";

// Thin coloured bar above the header. Phones show one message at a time.
export default function DealsStrip() {
  const { signInEnabled } = useShop();
  const messages = [
    { text: `🚚 FREE shipping on orders over $${FREE_SHIPPING_THRESHOLD_AUD_CENTS / 100}`, href: "/shop" },
    ...(signInEnabled ? [{ text: `🎁 Join HugosToyz Rewards – get ${SIGNUP_POINTS} points free`, href: "/account" }] : []),
    { text: "🇦🇺 3D printed by hand in Australia", href: "/#about" },
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % messages.length), 4000);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="bg-gradient-to-r from-htz-pink via-htz-orange to-htz-pink text-sm font-semibold text-white">
      <div className="mx-auto flex max-w-7xl justify-center gap-8 px-4 py-1.5">
        {messages.map((message, i) => (
          <Link
            key={message.text}
            href={message.href}
            className={`hover:underline ${i === index % messages.length ? "block" : "hidden"} md:block`}
          >
            {message.text}
          </Link>
        ))}
      </div>
    </div>
  );
}
