import { readStore, writeStore } from "./store";
import type {
  BannerSettings,
  CategoryDef,
  Product,
  SizeOption,
  StoreSettings,
} from "./product-types";

export type {
  Product,
  CategoryDef,
  SizeOption,
  StoreSettings,
  StoreData,
  BannerSettings,
} from "./product-types";

export async function getAllProducts(): Promise<Product[]> {
  const store = await readStore();
  return store.products;
}

export async function getActiveProducts(): Promise<Product[]> {
  return (await getAllProducts()).filter((product) => product.active);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return (await getAllProducts()).find((product) => product.id === id);
}

export async function saveAllProducts(products: Product[]): Promise<void> {
  const store = await readStore();
  await writeStore({ ...store, products });
}

export type StoreConfig = {
  categories: CategoryDef[];
  colors: string[];
  sizeOptions: SizeOption[];
  settings: StoreSettings;
  banner: BannerSettings;
};

export async function getStoreConfig(): Promise<StoreConfig> {
  const store = await readStore();
  return {
    categories: store.categories,
    colors: store.colors,
    sizeOptions: store.sizeOptions,
    settings: store.settings,
    banner: store.banner,
  };
}

export async function saveStoreConfig(products: Product[], config: StoreConfig): Promise<void> {
  const store = await readStore();
  await writeStore({ ...store, products, ...config });
}
