import type { Review } from "@/lib/product-types";

function Stars({ rating }: { rating: number }) {
  return (
    <p className="text-lg tracking-wide" aria-label={`${rating} out of 5 stars`}>
      <span className="text-htz-orange">{"★".repeat(rating)}</span>
      <span className="text-htz-navy/15">{"★".repeat(5 - rating)}</span>
    </p>
  );
}

export default function Reviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  return (
    <section id="reviews" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6 lg:px-8">
      <h2 className="mb-8 text-center font-display text-3xl font-bold text-htz-navy sm:text-4xl">
        What customers say
      </h2>
      <div className="flex flex-wrap justify-center gap-6">
        {reviews.map((review) => (
          <figure
            key={review.id}
            className="flex w-full flex-col gap-3 rounded-3xl bg-white p-6 shadow-md sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
          >
            <Stars rating={review.rating} />
            <blockquote className="flex-1 text-htz-navy/80">&ldquo;{review.text}&rdquo;</blockquote>
            <figcaption className="font-display font-semibold text-htz-navy">
              – {review.name}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
