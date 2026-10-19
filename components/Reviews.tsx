"use client";

import { useState } from "react";
import {
  REVIEW_NAME_MAX,
  REVIEW_TEXT_MAX,
  REVIEW_TEXT_MIN,
  type Review,
} from "@/lib/product-types";

const INITIAL_SHOWN = 6;
const inputClass =
  "w-full rounded-lg border border-htz-navy/20 bg-white px-3 py-2 focus:border-htz-orange focus:outline-none";

function Stars({ rating }: { rating: number }) {
  return (
    <p className="text-lg tracking-wide" aria-label={`${rating} out of 5 stars`}>
      <span className="text-htz-orange">{"★".repeat(rating)}</span>
      <span className="text-htz-navy/15">{"★".repeat(5 - rating)}</span>
    </p>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-AU", { month: "short", year: "numeric" });
}

function ReviewForm({ onPosted }: { onPosted: (review: Review) => void }) {
  const [startedAt] = useState(() => Date.now());
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!rating) {
      setError("Please choose 1 to 5 stars.");
      return;
    }
    setSending(true);
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, text, rating, website, startedAt }),
    });
    const data = await response.json().catch(() => ({}));
    setSending(false);
    if (!response.ok) {
      setError(data.error ?? "Sorry, something went wrong. Please try again.");
      return;
    }
    if (data.review) onPosted(data.review);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mb-10 max-w-xl rounded-3xl bg-white p-6 shadow-md">
      <h3 className="font-display text-xl font-bold text-htz-navy">Write a review</h3>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-htz-navy">Your rating</legend>
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((stars) => (
            <button
              key={stars}
              type="button"
              onClick={() => setRating(stars)}
              aria-label={`${stars} star${stars > 1 ? "s" : ""}`}
              aria-pressed={rating === stars}
              className={`text-3xl transition-transform hover:scale-110 ${stars <= rating ? "text-htz-orange" : "text-htz-navy/20"}`}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 flex flex-col gap-1">
        <span className="text-sm font-semibold text-htz-navy">Your first name</span>
        <input
          type="text"
          required
          value={name}
          maxLength={REVIEW_NAME_MAX}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sarah"
          className={inputClass}
        />
      </label>

      <label className="mt-4 flex flex-col gap-1">
        <span className="text-sm font-semibold text-htz-navy">
          Your review{" "}
          <span className="font-normal text-htz-navy/50">
            ({text.length}/{REVIEW_TEXT_MAX})
          </span>
        </span>
        <textarea
          required
          value={text}
          minLength={REVIEW_TEXT_MIN}
          maxLength={REVIEW_TEXT_MAX}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="What did you think?"
          className={inputClass}
        />
      </label>

      {/* Hidden from people; bots that fill it in are ignored. */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {error && <p className="mt-3 text-sm font-semibold text-htz-pink">{error}</p>}

      <button
        type="submit"
        disabled={sending}
        className="mt-4 rounded-full bg-htz-lime px-6 py-2 font-display font-bold text-htz-navy shadow transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
      >
        {sending ? "Posting…" : "Post review"}
      </button>
    </form>
  );
}

export default function Reviews({ reviews: initialReviews }: { reviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [showAll, setShowAll] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [thanks, setThanks] = useState(false);

  const shown = showAll ? reviews : reviews.slice(0, INITIAL_SHOWN);
  const average =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  return (
    <section id="reviews" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h2 className="font-display text-3xl font-bold text-htz-navy sm:text-4xl">
          What customers say
        </h2>
        {reviews.length > 0 ? (
          <p className="mt-2 text-htz-navy/70">
            <span className="text-htz-orange">★</span> {average.toFixed(1)} out of 5 from{" "}
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </p>
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
              className="mt-4 rounded-full border-2 border-htz-navy/15 bg-white px-6 py-2 font-display font-semibold text-htz-navy transition-colors hover:border-htz-orange hover:text-htz-orange"
            >
              ✍️ Write a review
            </button>
          )
        )}
      </div>

      {formOpen && !thanks && (
        <ReviewForm
          onPosted={(review) => {
            setReviews((prev) => [review, ...prev]);
            setThanks(true);
            setFormOpen(false);
          }}
        />
      )}

      {shown.length > 0 && (
        <div className="flex flex-wrap justify-center gap-6">
          {shown.map((review) => (
            <figure
              key={review.id}
              className="flex w-full flex-col gap-3 rounded-3xl bg-white p-6 shadow-md sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
            >
              <Stars rating={review.rating} />
              <blockquote className="flex-1 break-words text-htz-navy/80">
                &ldquo;{review.text}&rdquo;
              </blockquote>
              <figcaption className="flex items-baseline justify-between gap-2">
                <span className="font-display font-semibold text-htz-navy">– {review.name}</span>
                <span className="text-xs text-htz-navy/50">{formatDate(review.createdAt)}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {!showAll && reviews.length > INITIAL_SHOWN && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="font-semibold text-htz-orange hover:underline"
          >
            Show all {reviews.length} reviews
          </button>
        </div>
      )}
    </section>
  );
}
