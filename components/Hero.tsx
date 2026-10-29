import type { HomeText } from "@/lib/product-types";

export default function Hero({ heroImage, text }: { heroImage: string; text: HomeText }) {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-br from-htz-navy via-htz-teal to-htz-navy text-white"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
        <div className="text-center lg:text-left">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-htz-lime">
            HugosToyz
          </p>
          <h1 className="font-display mt-3 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            {text.heroHeadline}
            {text.heroHighlight && (
              <>
                {" "}
                <span className="text-htz-pink">{text.heroHighlight}</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-5 max-w-md text-lg text-white/80 lg:mx-0">
            {text.heroIntro}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <a
              href="#shop"
              className="rounded-full bg-htz-lime px-8 py-3 font-display text-lg font-bold text-htz-navy shadow-lg transition-transform hover:scale-105 hover:rotate-1 active:scale-95"
            >
              Shop Now
            </a>
            <a
              href="#about"
              className="rounded-full border-2 border-white/30 px-8 py-3 font-display text-lg font-semibold text-white transition-colors hover:border-htz-pink hover:text-htz-pink"
            >
              Our Story
            </a>
          </div>
        </div>

        <div className="flex justify-center">
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImage}
              alt="3D printed fidget toys by HugosToyz"
              className="animate-float aspect-square w-64 rounded-[2rem] object-cover shadow-2xl ring-4 ring-htz-pink/40 sm:w-80 lg:w-96"
            />
          ) : (
            <div className="animate-float flex h-56 w-56 items-center justify-center rounded-full bg-white/10 shadow-2xl ring-4 ring-htz-pink/40 sm:h-72 sm:w-72">
              <span className="text-8xl sm:text-9xl" aria-hidden="true">
                🌀
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
