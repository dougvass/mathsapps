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

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  emoji: string;
  image: string;
  active: boolean;
  chooseColor: boolean;
  stock: StockLevel;
};

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
  adminPasswordHash: string | null;
};
