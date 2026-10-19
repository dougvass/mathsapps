"use client";

import {
  SOCIAL_NETWORKS,
  type Faq,
  type Review,
  type SocialLinks,
  type SocialNetwork,
} from "@/lib/product-types";
import ImageDropzone from "./ImageDropzone";

const cardClass = "rounded-2xl bg-white p-5 shadow-sm";
const inputClass =
  "rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none";
const smallButtonClass =
  "rounded-full bg-htz-orange px-3 py-1 text-xs font-bold text-white shadow transition-transform hover:scale-105 active:scale-95";
const linkButtonClass = "text-xs font-semibold hover:underline disabled:opacity-30";

function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function HeroPhotoSection({
  heroImage,
  onChange,
}: {
  heroImage: string;
  onChange: (url: string) => void;
}) {
  return (
    <div className={cardClass}>
      <h2 className="font-display text-lg font-bold text-htz-navy">Homepage Photo</h2>
      <p className="mb-3 mt-1 text-sm text-htz-navy/60">
        The big picture at the top of the shop. Use your best product photo – a square photo works
        best. Leave empty to show the spinning 🌀.
      </p>
      <div className="w-48">
        <ImageDropzone
          value={heroImage}
          onChange={onChange}
          maxDimension={1200}
          emptyLabel="Drop a photo here, or click to choose"
        />
      </div>
    </div>
  );
}

export function ReviewsEditor({
  reviews,
  onChange,
}: {
  reviews: Review[];
  onChange: (reviews: Review[]) => void;
}) {
  function update(index: number, changes: Partial<Review>) {
    onChange(reviews.map((review, i) => (i === index ? { ...review, ...changes } : review)));
  }

  return (
    <div className={cardClass}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-htz-navy">Customer Reviews</h2>
        <button
          type="button"
          onClick={() =>
            onChange([...reviews, { id: `review-${Date.now()}`, name: "", text: "", rating: 5 }])
          }
          className={smallButtonClass}
        >
          + Add Review
        </button>
      </div>
      <p className="mb-3 text-sm text-htz-navy/60">
        Shown on the homepage. Only add real reviews from real customers, with their permission –
        first name is enough.
      </p>
      {reviews.length === 0 && <p className="text-sm text-htz-navy/50">No reviews yet.</p>}
      <div className="flex flex-col gap-4">
        {reviews.map((review, index) => (
          <div key={review.id} className="rounded-xl border border-htz-navy/10 p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={review.name}
                maxLength={60}
                onChange={(e) => update(index, { name: e.target.value })}
                placeholder="Customer name, e.g. Sarah from Sydney"
                className={inputClass}
              />
              <select
                value={review.rating}
                onChange={(e) => update(index, { rating: Number(e.target.value) })}
                className={inputClass}
                aria-label="Star rating"
              >
                {[5, 4, 3, 2, 1].map((stars) => (
                  <option key={stars} value={stars}>
                    {"★".repeat(stars)} ({stars})
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={review.text}
              maxLength={600}
              onChange={(e) => update(index, { text: e.target.value })}
              placeholder="What they said"
              rows={2}
              className={`${inputClass} mt-2 w-full`}
            />
            <div className="mt-1 flex gap-4">
              <button type="button" onClick={() => onChange(move(reviews, index, -1))} disabled={index === 0} className={`${linkButtonClass} text-htz-navy`}>
                ↑ Up
              </button>
              <button type="button" onClick={() => onChange(move(reviews, index, 1))} disabled={index === reviews.length - 1} className={`${linkButtonClass} text-htz-navy`}>
                ↓ Down
              </button>
              <button
                type="button"
                onClick={() => onChange(reviews.filter((_, i) => i !== index))}
                className={`${linkButtonClass} ml-auto text-htz-pink`}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FaqEditor({
  faqs,
  defaults,
  onChange,
}: {
  faqs: Faq[];
  defaults: Faq[];
  onChange: (faqs: Faq[]) => void;
}) {
  function update(index: number, changes: Partial<Faq>) {
    onChange(faqs.map((faq, i) => (i === index ? { ...faq, ...changes } : faq)));
  }

  return (
    <div className={cardClass}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-htz-navy">FAQ</h2>
        <button
          type="button"
          onClick={() => onChange([...faqs, { question: "", answer: "" }])}
          className={smallButtonClass}
        >
          + Add Question
        </button>
      </div>
      <p className="mb-3 text-sm text-htz-navy/60">
        Shown at the bottom of the homepage.{" "}
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Replace all questions with the starter FAQ?")) onChange(defaults);
          }}
          className="font-semibold text-htz-orange hover:underline"
        >
          Restore starter questions
        </button>
      </p>
      <div className="flex flex-col gap-4">
        {faqs.map((faq, index) => (
          <div key={index} className="rounded-xl border border-htz-navy/10 p-3">
            <input
              type="text"
              value={faq.question}
              onChange={(e) => update(index, { question: e.target.value })}
              placeholder="Question"
              className={`${inputClass} w-full font-semibold`}
            />
            <textarea
              value={faq.answer}
              onChange={(e) => update(index, { answer: e.target.value })}
              placeholder="Answer"
              rows={3}
              className={`${inputClass} mt-2 w-full`}
            />
            <div className="mt-1 flex gap-4">
              <button type="button" onClick={() => onChange(move(faqs, index, -1))} disabled={index === 0} className={`${linkButtonClass} text-htz-navy`}>
                ↑ Up
              </button>
              <button type="button" onClick={() => onChange(move(faqs, index, 1))} disabled={index === faqs.length - 1} className={`${linkButtonClass} text-htz-navy`}>
                ↓ Down
              </button>
              <button
                type="button"
                onClick={() => onChange(faqs.filter((_, i) => i !== index))}
                className={`${linkButtonClass} ml-auto text-htz-pink`}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SOCIAL_PLACEHOLDERS: Record<SocialNetwork, string> = {
  instagram: "https://www.instagram.com/yourname",
  tiktok: "https://www.tiktok.com/@yourname",
  facebook: "https://www.facebook.com/yourpage",
  youtube: "https://www.youtube.com/@yourchannel",
};

const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  youtube: "YouTube",
};

export function SocialLinksEditor({
  links,
  onChange,
}: {
  links: SocialLinks;
  onChange: (links: SocialLinks) => void;
}) {
  return (
    <div className={cardClass}>
      <h2 className="font-display text-lg font-bold text-htz-navy">Social Media Links</h2>
      <p className="mb-3 mt-1 text-sm text-htz-navy/60">
        Paste the full link to each profile. Icons appear in the footer for the ones you fill in,
        and Google uses them to connect HugosToyz across the web.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SOCIAL_NETWORKS.map((network) => (
          <label key={network} className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-htz-navy">{SOCIAL_LABELS[network]}</span>
            <input
              type="url"
              value={links[network]}
              onChange={(e) => onChange({ ...links, [network]: e.target.value.trim() })}
              placeholder={SOCIAL_PLACEHOLDERS[network]}
              className={inputClass}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
