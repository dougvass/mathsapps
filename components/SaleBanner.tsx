import type { BannerSettings } from "@/lib/product-types";

export default function SaleBanner({ banner }: { banner: BannerSettings }) {
  if (!banner.enabled) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
      {banner.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={banner.image}
          alt={[banner.headline, banner.subtext].filter(Boolean).join(" – ")}
          className="w-full rounded-3xl shadow-md"
        />
      ) : (
        <div className="rounded-3xl bg-gradient-to-r from-htz-pink to-htz-orange px-6 py-8 text-center text-white shadow-md">
          <p className="font-display text-3xl font-bold sm:text-4xl">{banner.headline}</p>
          {banner.subtext && <p className="mt-2 text-lg text-white/90">{banner.subtext}</p>}
        </div>
      )}
    </section>
  );
}
