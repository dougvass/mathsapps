import type { Rating, Review } from "./product-types";

// Average star rating and review count for each reviewed product.
export function ratingsByProduct(reviews: Review[]): Record<string, Rating> {
  const totals: Record<string, { sum: number; count: number }> = {};
  for (const review of reviews) {
    if (!review.productId) continue;
    const entry = (totals[review.productId] ??= { sum: 0, count: 0 });
    entry.sum += review.rating;
    entry.count += 1;
  }
  return Object.fromEntries(
    Object.entries(totals).map(([id, { sum, count }]) => [id, { average: sum / count, count }])
  );
}
