"use client";

import { useWishlist } from "@/lib/local-lists";

export default function WishlistButton({
  productId,
  productName,
  className = "",
}: {
  productId: string;
  productName: string;
  className?: string;
}) {
  const { has, toggle } = useWishlist();
  const saved = has(productId);
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        toggle(productId);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      title={saved ? "Saved to wishlist" : "Save to wishlist"}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-xl shadow transition-transform hover:scale-110 ${saved ? "text-htz-pink" : "text-htz-navy/40"} ${className}`}
    >
      {saved ? "♥" : "♡"}
    </button>
  );
}
