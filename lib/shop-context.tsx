"use client";

import { createContext, useContext } from "react";
import type { CategoryDef, Product, Rating, SizeOption } from "./product-types";

export type ShopData = {
  products: Product[];
  categories: CategoryDef[];
  colors: string[];
  sizeOptions: SizeOption[];
  ratings: Record<string, Rating>;
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

// Simple products can be added straight from a tile; others need the product page.
export function needsOptions(product: Product, sizeOptions: SizeOption[]): boolean {
  return product.chooseColor || product.needsCustomText || sizeOptions.length !== 1;
}
