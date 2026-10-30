import { cache } from "react";
import { getActiveProducts, getSoldCounts, getStoreConfig } from "./products";
import { getReviews } from "./reviews";
import { ratingsByProduct } from "./ratings";
import { signInConfigured } from "./user-session";
import { activeSeason } from "./season";

// Everything a shop page needs, read once per request.
export const loadShopData = cache(async () => {
  const [products, config, reviews, soldCounts] = await Promise.all([
    getActiveProducts(),
    getStoreConfig(),
    getReviews(),
    getSoldCounts(),
  ]);
  return {
    products,
    config,
    reviews,
    shop: {
      products,
      categories: config.categories,
      colors: config.colors,
      sizeOptions: config.sizeOptions,
      ratings: ratingsByProduct(reviews),
      signInEnabled: signInConfigured(),
      holiday: config.holiday,
      season: activeSeason(config.season),
      soldCounts,
    },
  };
});
