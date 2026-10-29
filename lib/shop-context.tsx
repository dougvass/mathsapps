"use client";

import { createContext, useContext } from "react";
import {
  SPECIAL_PRODUCT_IDS,
  type CategoryDef,
  type HolidayMode,
  type Product,
  type Rating,
  type SizeOption,
} from "./product-types";

export type ShopData = {
  products: Product[];
  categories: CategoryDef[];
  colors: string[];
  sizeOptions: SizeOption[];
  ratings: Record<string, Rating>;
  signInEnabled: boolean;
  holiday: HolidayMode;
  soldCounts: Record<string, number>;
};

const ShopContext = createContext<ShopData | null>(null);

export function ShopDataProvider({ data, children }: { data: ShopData; children: React.ReactNode }) {
  return <ShopContext.Provider value={data}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopData {
  const data = useContext(ShopContext);
  if (!data) throw new Error("useShop must be used within a ShopDataProvider");
  return data;
}

// Only show "sold" counts once there's a few, so new toys don't say "1 sold".
export const SHOW_SOLD_FROM = 3;

export function holidayNotice(holiday: HolidayMode): string | null {
  if (!holiday.enabled) return null;
  const back = holiday.until
    ? new Date(`${holiday.until}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "long" })
    : "";
  const base = back ? `We're on a break until ${back} – orders will be posted when we're back.` : "We're on a short break – orders will be posted when we're back.";
  return holiday.message ? `${holiday.message} ${base}` : base;
}

// Simple products can be added straight from a tile; others need the product page.
export function needsOptions(product: Product, sizeOptions: SizeOption[]): boolean {
  return (
    SPECIAL_PRODUCT_IDS.includes(product.id) ||
    product.chooseColor ||
    product.needsCustomText ||
    sizeOptions.length !== 1
  );
}
