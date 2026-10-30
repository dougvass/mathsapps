import type { SeasonSetting } from "./season";
export type StockLevel = number | "out-of-stock" | "made-to-order";

export const MAX_STOCK = 9999;

export function isValidStock(value: unknown): value is StockLevel {
  return (
    value === "out-of-stock" ||
    value === "made-to-order" ||
    (Number.isInteger(value) && (value as number) >= 1 && (value as number) <= MAX_STOCK)
  );
}

export function stockLimit(stock: StockLevel): number {
  if (typeof stock === "number") return stock;
  return stock === "out-of-stock" ? 0 : Infinity;
}

export type ProductBadge = "" | "new" | "bestseller";

export const BADGE_LABELS: Record<Exclude<ProductBadge, "">, string> = {
  new: "New",
  bestseller: "Bestseller",
};

export const MAX_GALLERY_PHOTOS = 6;
export const MAX_CUSTOM_TEXT_LENGTH = 30;

// Removes control characters and extra spaces from text a customer wants printed.
export function cleanCustomText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  emoji: string;
  image: string;
  gallery: string[];
  badge: ProductBadge;
  active: boolean;
  chooseColor: boolean;
  needsCustomText: boolean;
  stock: StockLevel;
  // Price before a sale (0 = not on sale). Shown crossed out.
  wasPrice: number;
};

// Built-in products with their own order pages.
export const MYSTERY_BAG_ID = "mystery-bag";
export const FILE_PRINT_ID = "print-your-file";
export const GIFT_CARD_ID = "gift-card";
export const SPECIAL_PRODUCT_IDS = [MYSTERY_BAG_ID, FILE_PRINT_ID, GIFT_CARD_ID];

export type ToyOfWeek = { productId: string; blurb: string };
export type HolidayMode = { enabled: boolean; until: string; message: string };

export function productPhotos(product: Product): string[] {
  return [product.image, ...product.gallery].filter(Boolean);
}

export type Review = {
  id: string;
  name: string;
  text: string;
  rating: number;
  // ISO date; empty for reviews added before dates were recorded.
  createdAt: string;
  // The product reviewed; empty for reviews of the shop as a whole.
  productId: string;
};

export type Rating = { average: number; count: number };

export const REVIEW_NAME_MAX = 40;
export const REVIEW_TEXT_MIN = 10;
export const REVIEW_TEXT_MAX = 600;

export type Faq = {
  question: string;
  answer: string;
};

export const SOCIAL_NETWORKS = ["instagram", "tiktok", "facebook", "youtube"] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];
export type SocialLinks = Record<SocialNetwork, string>;

export type CategoryDef = {
  value: string;
  label: string;
};

export type SizeOption = {
  label: string;
  maxDimensionMm: number;
};

export type StoreSettings = {
  printerMaxBuildMm: number;
};

export type AdminOrder = {
  id: string;
  paymentIntentId: string | null;
  createdAt: number;
  customerName: string;
  email: string;
  shippingName: string;
  address: string;
  shippingMethod: string;
  items: { description: string; quantity: number }[];
  totalCents: number;
  discountCents: number;
  postedAt: string | null;
  giftWrap: boolean;
  giftMessage: string;
  // Uploaded 3D files to print for this order.
  printFiles: { id: string; name: string }[];
};

export type DiscountCode = {
  id: string;
  code: string;
  label: string;
  active: boolean;
  timesRedeemed: number;
  maxRedemptions: number | null;
  expiresAt: number | null;
  firstOrderOnly: boolean;
};

export type BannerSettings = {
  enabled: boolean;
  image: string;
  headline: string;
  subtext: string;
};

export type StoreData = {
  products: Product[];
  categories: CategoryDef[];
  colors: string[];
  sizeOptions: SizeOption[];
  settings: StoreSettings;
  banner: BannerSettings;
  heroImage: string;
  homeText: HomeText;
  faqs: Faq[];
  socialLinks: SocialLinks;
  adminPasswordHash: string | null;
  // Stripe checkout sessions whose items have already been taken off stock.
  stockAppliedSessions: string[];
  toyOfWeek: ToyOfWeek;
  holiday: HolidayMode;
  season: SeasonSetting;
  // How many of each product have sold (counted by the Stripe webhook).
  soldCounts: Record<string, number>;
  // Set once the mystery bag and file printing products have been added.
  specialProductsAdded: boolean;
  // Which built-in products have been added (each once; the admin can remove them after).
  specialsAdded: string[];
};

export type HomeText = {
  heroHeadline: string;
  heroHighlight: string;
  heroIntro: string;
  aboutTitle: string;
  aboutText: string;
};
