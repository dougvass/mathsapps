"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/product-types";
import { productPhotos } from "@/lib/product-types";
import ProductImage, { sizedImage } from "./ProductImage";

// Swipeable photo gallery (scroll-snap) with thumbnails to jump between photos.
export default function ProductGallery({ product }: { product: Product }) {
  const photos = productPhotos(product);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [broken, setBroken] = useState(false);

  // If the photos can't load (e.g. storage paused), show the emoji tile instead.
  useEffect(() => {
    if (photos.length === 0) return;
    const test = new Image();
    test.onerror = () => setBroken(true);
    test.src = sizedImage(photos[0], 960);
  }, [photos]);

  if (photos.length === 0 || broken) {
    return (
      <div className="aspect-square overflow-hidden rounded-3xl shadow-md">
        <ProductImage product={product} width={960} eager />
      </div>
    );
  }

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex aspect-square snap-x snap-mandatory overflow-x-auto overflow-y-hidden rounded-3xl bg-surface shadow-md [scrollbar-width:none]"
      >
        {photos.map((photo, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo}
            src={sizedImage(photo, 960)}
            alt={`${product.name}${photos.length > 1 ? ` – photo ${index + 1}` : ""}`}
            className="h-full w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>

      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, index) => (
            <button
              key={photo}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Show photo ${index + 1}`}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                index === active ? "border-htz-orange" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sizedImage(photo, 320)} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
