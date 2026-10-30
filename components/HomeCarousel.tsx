"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sizedImage } from "./ProductImage";
import type { BannerSettings, HomeText } from "@/lib/product-types";

type Slide = { key: string; label: string; content: React.ReactNode };

const AUTO_ADVANCE_MS = 6000;

// Big sliding banner at the top of the homepage (welcome, sale, custom orders).
export default function HomeCarousel({
  heroImage,
  text,
  banner,
}: {
  heroImage: string;
  text: HomeText;
  banner: BannerSettings;
}) {
  const slides: Slide[] = [
    {
      key: "welcome",
      label: "Welcome",
      content: (
        <div className="grid h-full items-center gap-6 bg-gradient-to-br from-htz-navy via-htz-teal to-htz-navy px-6 py-10 text-white sm:px-12 md:grid-cols-[1.3fr_1fr]">
          <div className="text-center md:text-left">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-htz-lime">HugosToyz</p>
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-5xl">
              {text.heroHeadline}
              {text.heroHighlight && <span className="text-htz-pink">{` ${text.heroHighlight}`}</span>}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-white/80 md:mx-0 sm:text-lg">{text.heroIntro}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link
                href="/shop"
                className="rounded-full bg-htz-lime px-7 py-2.5 font-display text-lg font-bold text-htz-navy shadow-lg transition-transform hover:scale-105"
              >
                Shop Now
              </Link>
              <Link
                href="#about"
                className="rounded-full border-2 border-white/30 px-7 py-2.5 font-display text-lg font-semibold text-white hover:border-htz-pink hover:text-htz-pink"
              >
                Our Story
              </Link>
            </div>
          </div>
          <div className="hidden justify-center md:flex">
            {heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sizedImage(heroImage, 640)}
                alt="3D printed fidget toys by HugosToyz"
                className="aspect-square w-64 rounded-[2rem] object-cover shadow-2xl ring-4 ring-htz-pink/40 lg:w-72"
              />
            ) : (
              <span className="text-[9rem] leading-none" aria-hidden="true">🌀</span>
            )}
          </div>
        </div>
      ),
    },
  ];

  slides.push({
    key: "quiz",
    label: "Fidget quiz",
    content: (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#7c3aed] via-htz-pink to-htz-orange px-6 py-10 text-center text-white">
        <span className="text-6xl" aria-hidden="true">🧩🤔</span>
        <p className="font-display text-3xl font-bold sm:text-5xl">Which fidget are you?</p>
        <p className="max-w-md text-white/90 sm:text-lg">Answer 3 quick questions and we&apos;ll pick your perfect toy.</p>
        <Link
          href="/quiz"
          className="mt-3 rounded-full bg-white px-7 py-2.5 font-display text-lg font-bold text-[#7c3aed] shadow-lg transition-transform hover:scale-105"
        >
          Take the quiz →
        </Link>
      </div>
    ),
  });

  if (banner.enabled) {
    slides.push({
      key: "sale",
      label: banner.headline || "Sale",
      content: banner.image ? (
        <Link href="/shop" className="block h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.image}
            alt={[banner.headline, banner.subtext].filter(Boolean).join(" – ")}
            className="h-full w-full object-cover"
          />
        </Link>
      ) : (
        <div className="flex h-full flex-col items-center justify-center bg-gradient-to-r from-htz-pink to-htz-orange px-6 py-10 text-center text-white">
          <p className="font-display text-4xl font-bold sm:text-6xl">{banner.headline}</p>
          {banner.subtext && <p className="mt-3 text-lg text-white/90 sm:text-xl">{banner.subtext}</p>}
          <Link
            href="/shop"
            className="mt-6 rounded-full bg-white px-7 py-2.5 font-display text-lg font-bold text-htz-pink shadow-lg transition-transform hover:scale-105"
          >
            Shop the sale
          </Link>
        </div>
      ),
    });
  }

  slides.push({
    key: "custom",
    label: "Design your own",
    content: (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-htz-lime via-[#e9ffa8] to-htz-lime px-6 py-10 text-center text-htz-navy">
        <span className="text-6xl" aria-hidden="true">🐉✨</span>
        <p className="font-display text-3xl font-bold sm:text-5xl">Design your own</p>
        <p className="max-w-md text-htz-navy/80 sm:text-lg">
          Pick your colours and add a name – printed just for you.
        </p>
        <Link
          href="/shop?category=custom"
          className="mt-3 rounded-full bg-htz-navy px-7 py-2.5 font-display text-lg font-bold text-white shadow-lg transition-transform hover:scale-105"
        >
          Make yours
        </Link>
      </div>
    ),
  });

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = setTimeout(() => go(index + 1), AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [index, paused, count, go]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStart.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        if (touchStart.current === null) return;
        const moved = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(moved) > 40) go(index + (moved < 0 ? 1 : -1));
        touchStart.current = null;
      }}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.key}
            className="h-[22rem] w-full shrink-0 sm:h-[24rem]"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}: ${slide.label}`}
            aria-hidden={i !== index}
            inert={i !== index}
          >
            {slide.content}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 hidden h-12 w-9 -translate-y-1/2 items-center justify-center rounded-md bg-white/70 text-2xl text-htz-navy shadow hover:bg-white sm:flex"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 hidden h-12 w-9 -translate-y-1/2 items-center justify-center rounded-md bg-white/70 text-2xl text-htz-navy shadow hover:bg-white sm:flex"
          >
            ›
          </button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.key}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show slide ${i + 1}: ${slide.label}`}
                aria-current={i === index}
                className={`h-2.5 rounded-full transition-all ${i === index ? "w-7 bg-htz-orange" : "w-2.5 bg-white/70 ring-1 ring-htz-navy/20"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
