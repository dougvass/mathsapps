"use client";

import { useState } from "react";
import type { Review } from "@/lib/product-types";
import { ReviewCard, ReviewForm } from "./Reviews";
import Stars from "./Stars";

const INITIAL_SHOWN = 4;

// Reviews for one product, with a form to add one.
export default function ProductReviews({
  productId,
  productName,
  reviews: initialReviews,
}: {
  productId: string;
  productName: string;
  reviews: Review[];
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [formOpen, setFormOpen] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const average = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const counts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));
  const shown = showAll ? reviews : reviews.slice(0, INITIAL_SHOWN);

  return (
    <section id="product-reviews" className="scroll-mt-36 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr]">
        <div>
          <h2 className="font-display text-2xl font-bold text-htz-navy">Customer reviews</h2>
          {reviews.length > 0 ? (
            <>
              <div className="mt-2 flex items-center gap-2">
                <Stars rating={average} size="text-xl" />
                <span className="font-semibold text-htz-navy">{average.toFixed(1)} out of 5</span>
              </div>
              <p className="text-sm text-htz-navy/60">
                {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </p>
              <ul className="mt-4 flex flex-col gap-1.5">
                {counts.map(({ stars, count }) => (
                  <li key={stars} className="flex items-center gap-2 text-sm text-htz-navy/70">
                    <span className="w-12">{stars} star</span>
                    <span className="h-3 flex-1 overflow-hidden rounded-full bg-htz-navy/10">
                      <span
                        className="block h-full rounded-full bg-htz-orange"
                        style={{ width: `${(count / reviews.length) * 100}%` }}
                      />
                    </span>
                    <span className="w-6 text-right">{count}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-htz-navy/70">No reviews yet – be the first!</p>
          )}
          {thanks ? (
            <p className="mt-4 font-semibold text-htz-teal" role="status">
              Thanks for your review! 🎉
            </p>
          ) : (
            !formOpen && (
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="mt-5 w-full rounded-full border-2 border-htz-navy/15 bg-white px-6 py-2 font-semibold text-htz-navy transition-colors hover:border-htz-orange hover:text-htz-orange"
              >
                ✍️ Write a review
              </button>
            )
          )}
        </div>

        <div>
          {formOpen && !thanks && (
            <ReviewForm
              productId={productId}
              productName={productName}
              onPosted={(review) => {
                setReviews((prev) => [review, ...prev]);
                setThanks(true);
                setFormOpen(false);
              }}
            />
          )}
          {shown.length > 0 && (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {shown.map((review) => (
                <li key={review.id} className="[&_figure]:bg-htz-cream/60 [&_figure]:shadow-none">
                  <ReviewCard review={review} />
                </li>
              ))}
            </ul>
          )}
          {!showAll && reviews.length > INITIAL_SHOWN && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-4 font-semibold text-htz-orange hover:underline"
            >
              Show all {reviews.length} reviews
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
