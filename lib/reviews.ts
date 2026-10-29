import type { Review } from "./product-types";
import { readStore } from "./store";
import { jsonFile } from "./json-file";

// Reviews live in their own file, separate from the rest of the store, so
// customers posting reviews and the admin saving products never overwrite
// each other's changes.
const MAX_STORED_REVIEWS = 500;

function normalise(raw: unknown): Review[] {
  return (Array.isArray(raw) ? (raw as Partial<Review>[]) : []).map((review) => ({
    id: String(review.id),
    name: String(review.name ?? ""),
    text: String(review.text ?? ""),
    rating: Number(review.rating ?? 5),
    createdAt: review.createdAt ?? "",
    productId: review.productId ?? "",
  }));
}

const file = jsonFile<Review[]>({
  blobPathname: "hugostoyz/reviews.json",
  localFile: "reviews.json",
  normalise,
  // Reviews added in the admin panel before reviews had their own file.
  empty: async () => normalise(((await readStore()) as { reviews?: unknown }).reviews ?? []),
});

export async function getReviews(): Promise<Review[]> {
  try {
    return await file.read();
  } catch (error) {
    console.error("Reading reviews failed:", error);
    return [];
  }
}

export async function updateReviews(change: (reviews: Review[]) => Review[]): Promise<void> {
  await file.update((reviews) => ({ data: change(reviews).slice(0, MAX_STORED_REVIEWS) }));
}
