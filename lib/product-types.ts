export type StockLevel = number | "out-of-stock" | "made-to-order";

export const MAX_STOCK = 10;

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
};

export function productPhotos(product: Product): string[] {
  return [product.image, ...product.gallery].filter(Boolean);
}

export type Review = {
  id: string;
  name: string;
  text: string;
  rating: number;
};

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
  reviews: Review[];
  faqs: Faq[];
  socialLinks: SocialLinks;
  adminPasswordHash: string | null;
};
