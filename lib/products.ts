import { readStore, writeStore } from "./store";
import type { Product, StoreData } from "./product-types";

export type {
  Product,
  CategoryDef,
  SizeOption,
  StoreSettings,
  StoreData,
  BannerSettings,
  Review,
  Faq,
  SocialLinks,
} from "./product-types";

export async function getAllProducts(): Promise<Product[]> {
  const store = await readStore();
  return store.products;
}

export async function getActiveProducts(): Promise<Product[]> {
  return (await getAllProducts()).filter((product) => product.active);
}

// Everything the admin panel edits apart from products; never includes the
// password hash.
export type StoreConfig = Omit<StoreData, "products" | "adminPasswordHash">;

export async function getStoreConfig(): Promise<StoreConfig> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { products, adminPasswordHash, ...config } = await readStore();
  return config;
}

export async function saveStoreConfig(products: Product[], config: StoreConfig): Promise<void> {
  const store = await readStore();
  await writeStore({ ...store, products, ...config });
}
