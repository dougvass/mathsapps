"use client";

import { useMemo } from "react";
import { useShop } from "@/lib/shop-context";

const PIECES = 18;

// Gently falling snow at Christmas, or drifting bats and pumpkins at Halloween.
// Purely decoration: it never blocks taps and stops for people who prefer less motion.
export default function SeasonEffects() {
  const { season } = useShop();
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => ({
        left: (i * 97) % 100,
        delay: (i * 1.7) % 12,
        duration: 9 + ((i * 3) % 8),
        size: 14 + ((i * 7) % 16),
      })),
    []
  );
  if (!season) return null;
  const symbols = season === "christmas" ? ["❄", "❅", "❆"] : ["🦇", "🎃", "👻"];

  return (
    <div aria-hidden="true" className="season-effects pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className={season === "christmas" ? "season-snow" : "season-spooky"}
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            fontSize: `${piece.size}px`,
          }}
        >
          {symbols[i % symbols.length]}
        </span>
      ))}
    </div>
  );
}
