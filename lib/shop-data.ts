import { cache } from "react";
import { getActiveProducts, getStoreConfig } from "./products";
import { getReviews } from "./reviews";
import { ratingsByProduct } from "./ratings";
import { signInConfigured } from "./user-session";

// Everything a shop page needs, read once per request.
export const loadShopData = cache(async () => {
  const [products, config, reviews] = await Promise.all([
    getActiveProducts(),
    getStoreConfig(),
    getReviews(),
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
    },
  };
});
