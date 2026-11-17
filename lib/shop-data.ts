import { cache } from "react";
import { getActiveProducts, getSoldCounts, getStoreConfig } from "./products";
import { getReviews } from "./reviews";
import { ratingsByProduct } from "./ratings";
import { signInConfigured } from "./user-session";
import { activeSeason } from "./season";
import { storageOffline } from "./store";

// Everything a shop page needs, read once per request.
export const loadShopData = cache(async () => {
  const [products, config, soldCounts] = await Promise.all([getActiveProducts(), getStoreConfig(), getSoldCounts()]);
  // Reviews switched off in the admin panel: show none (and don't read them).
  const reviewsEnabled = config.reviewSettings.enabled;
  const reviews = reviewsEnabled ? await getReviews() : [];
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
      reviewsEnabled,
      signInEnabled: signInConfigured(),
      holiday: config.holiday,
      season: activeSeason(config.season),
      // Storage paused: features that save things (like the prize wheel) hide.
      storageOffline: storageOffline(),
      soldCounts,
    },
  };
});
