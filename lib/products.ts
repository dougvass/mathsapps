import crypto from "crypto";
import { readStore, readStoreVersioned, StoreConflictError, writeStore } from "./store";
import type { Product, StoreData } from "./product-types";

export type {
  Product,
  CategoryDef,
  SizeOption,
  StoreSettings,
  StoreData,
  BannerSettings,
  Faq,
  SocialLinks,
  HomeText,
} from "./product-types";

const WRITE_ATTEMPTS = 5;

export async function getAllProducts(): Promise<Product[]> {
  const store = await readStore();
  return store.products;
}

export async function getActiveProducts(): Promise<Product[]> {
  return (await getAllProducts()).filter((product) => product.active);
}

// Everything the admin panel edits apart from products; never includes the
// password hash or internal bookkeeping.
export type StoreConfig = Omit<
  StoreData,
  "products" | "adminPasswordHash" | "stockAppliedSessions" | "soldCounts" | "specialProductsAdded" | "specialsAdded"
>;

function toConfig(store: StoreData): StoreConfig {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { products, adminPasswordHash, stockAppliedSessions, soldCounts, specialProductsAdded, specialsAdded, ...config } = store;
  return config;
}

export async function getSoldCounts(): Promise<Record<string, number>> {
  return (await readStore()).soldCounts;
}

// Fingerprint of just what the admin edits, so a password change doesn't count
// as a conflicting change but a sale lowering stock does.
function adminVersion(store: StoreData): string {
  return crypto
    .createHash("sha1")
    .update(JSON.stringify({ products: store.products, config: toConfig(store) }))
    .digest("hex");
}

export async function getStoreConfig(): Promise<StoreConfig> {
  return toConfig(await readStore());
}

// For the admin panel: products, settings and the version they were read at.
export async function getAdminStore() {
  const store = await readStore();
  return { products: store.products, ...toConfig(store), version: adminVersion(store) };
}

// Saves only if products/settings haven't changed since `version` was read
// (throws StoreConflictError otherwise). Returns the new version.
export async function saveStoreConfig(
  products: Product[],
  config: StoreConfig,
  version: string
): Promise<string> {
  for (let attempt = 1; attempt <= WRITE_ATTEMPTS; attempt++) {
    const { store, version: fileVersion } = await readStoreVersioned();
    if (adminVersion(store) !== version) throw new StoreConflictError();

    const next = { ...store, products, ...config };
    try {
      // The shop data still matches what the admin page loaded, so on the last
      // try save without the file check (in case the check itself misbehaves).
      await writeStore(next, attempt === WRITE_ATTEMPTS ? undefined : fileVersion);
      return adminVersion(next);
    } catch (error) {
      // Something else (e.g. a password change) saved in between; try again.
      if (!(error instanceof StoreConflictError) || attempt === WRITE_ATTEMPTS) throw error;
    }
  }
  throw new StoreConflictError();
}
