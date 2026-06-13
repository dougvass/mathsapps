import fs from "fs";
import path from "path";
import type { Product } from "./product-types";

export type { Product, ProductCategory } from "./product-types";
export { CATEGORY_ORDER, CATEGORY_LABELS } from "./product-types";

const DATA_FILE = path.join(process.cwd(), "data", "products.json");

export function getAllProducts(): Product[] {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw) as Product[];
}

export function getActiveProducts(): Product[] {
  return getAllProducts().filter((product) => product.active);
}

export function getProductById(id: string): Product | undefined {
  return getAllProducts().find((product) => product.id === id);
}

export function saveAllProducts(products: Product[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2) + "\n");
}
