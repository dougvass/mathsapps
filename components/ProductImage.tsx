"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/product-types";

const CATEGORY_GRADIENTS: Record<string, string> = {
  fidgets: "from-htz-orange to-htz-pink",
  shapes: "from-htz-teal to-htz-navy",
  custom: "from-htz-pink to-htz-orange",
};

const DEFAULT_GRADIENT = "from-htz-orange to-htz-teal";

// Our own uploads can be fetched smaller (see /api/images) for tiles and thumbnails.
export function sizedImage(src: string, width?: 320 | 640 | 960): string {
  return width && src.startsWith("/api/images/") ? `${src}?w=${width}` : src;
}

export default function ProductImage({
  product,
  width,
  eager = false,
}: {
  product: Product;
  width?: 320 | 640 | 960;
  eager?: boolean;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [broken, setBroken] = useState(false);

  // A photo that fails (e.g. storage paused) shows the emoji tile instead.
  // Checked after load too, because it can fail before the page is interactive.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setBroken(true);
  }, []);

  if (product.image && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={imgRef}
        onError={() => setBroken(true)}
        src={sizedImage(product.image, width)}
        alt={product.name}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${CATEGORY_GRADIENTS[product.category] ?? DEFAULT_GRADIENT}`}
    >
      <span className="text-6xl drop-shadow-sm" aria-hidden="true">
        {product.emoji}
      </span>
    </div>
  );
}
