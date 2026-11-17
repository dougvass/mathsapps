import crypto from "crypto";
import fs from "fs";
import path from "path";
import { revalidateTag, unstable_cache } from "next/cache";
import { BlobNotFoundError, BlobPreconditionFailedError, get, head, put } from "@vercel/blob";
import {
  FILE_PRINT_ID,
  GIFT_CARD_ID,
  MYSTERY_BAG_ID,
  type BannerSettings,
  type HomeText,
  type Product,
  type SocialLinks,
  type StoreData,
} from "./product-types";
import { DEFAULT_FAQS } from "./default-faqs";
import { NON_RETURNABLE_CATEGORY } from "./site";

const DATA_FILE = path.join(process.cwd(), "data", "store.json");
const BLOB_PATHNAME = "hugostoyz/store.json";
const WRITE_ATTEMPTS = 5;

const DEFAULT_BANNER: BannerSettings = {
  enabled: false,
  image: "",
  headline: "Sale Now On",
  subtext: "Bonus on your first order",
};

const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  instagram: "",
  tiktok: "",
  facebook: "",
  youtube: "",
};

export const DEFAULT_HOME_TEXT: HomeText = {
  heroHeadline: "Fidgets, but make it",
  heroHighlight: "FUN.",
  heroIntro:
    "Bright, 3D-printed fidgets and toys for busy hands and big imaginations. Spin it, click it, twist it, love it.",
  aboutTitle: "Made with love (and a lot of plastic spaghetti)",
  aboutText:
    "HugosToyz started with one 3D printer, one big idea, and a pile of fidget prototypes. Every toy is designed, printed, and finished by hand in small batches — built to spin, click, twist, and survive a backpack full of pencils. Whether you need something to keep your hands busy or a one-of-a-kind gift, we've got you covered.",
};

// Thrown when the store changed between reading and saving it.
export class StoreConflictError extends Error {
  constructor() {
    super(
      "The shop changed since you opened this page (for example, a sale lowered a stock count). Reload the page to get the latest, then make your changes again."
    );
  }
}

const SPECIAL_PRODUCTS: Product[] = [
  {
    id: MYSTERY_BAG_ID,
    name: "Mystery Bag",
    category: "fidgets",
    price: 20,
    description: "A surprise bag of 3–5 of our toys, picked by hand to match what you like.",
    emoji: "🎁",
    image: "",
    gallery: [],
    badge: "new",
    active: true,
    chooseColor: false,
    needsCustomText: false,
    stock: "made-to-order",
    wasPrice: 0,
  },
  {
    id: FILE_PRINT_ID,
    name: "Print Your Own 3D File",
    category: NON_RETURNABLE_CATEGORY,
    price: 8,
    description: "Upload an STL file and get an instant price. We print it in PLA and post it to you.",
    emoji: "🖨️",
    image: "",
    gallery: [],
    badge: "new",
    active: true,
    chooseColor: true,
    needsCustomText: false,
    stock: "made-to-order",
    wasPrice: 0,
  },
  {
    id: GIFT_CARD_ID,
    name: "HugosToyz Gift Card",
    category: "gift-cards",
    price: 10,
    description: "Let them pick their own toys! Choose $10, $20 or $50. The code shows straight after paying.",
    emoji: "🎟️",
    image: "",
    gallery: [],
    badge: "new",
    active: true,
    chooseColor: false,
    needsCustomText: false,
    stock: "made-to-order",
    wasPrice: 0,
  },
];

// Data saved before a field existed won't have it, so fill in defaults.
function withDefaults(data: StoreData): StoreData {
  // Each built-in product is added once; after that the admin can edit or remove it.
  // (Stores from before this list existed already had the first two added.)
  const alreadyAdded = data.specialsAdded ?? (data.specialProductsAdded ? [MYSTERY_BAG_ID, FILE_PRINT_ID] : []);
  const products = [
    ...data.products,
    ...SPECIAL_PRODUCTS.filter((p) => !alreadyAdded.includes(p.id) && !data.products.some((existing) => existing.id === p.id)),
  ];
  return {
    ...data,
    products: products.map((product) => ({
      ...product,
      stock: product.stock ?? "made-to-order",
      gallery: product.gallery ?? [],
      badge: product.badge ?? "",
      needsCustomText: product.needsCustomText ?? product.category === NON_RETURNABLE_CATEGORY,
      wasPrice: product.wasPrice ?? 0,
    })),
    banner: { ...DEFAULT_BANNER, ...data.banner },
    heroImage: data.heroImage ?? "",
    faqs: data.faqs ?? DEFAULT_FAQS,
    socialLinks: { ...DEFAULT_SOCIAL_LINKS, ...data.socialLinks },
    homeText: { ...DEFAULT_HOME_TEXT, ...data.homeText },
    stockAppliedSessions: data.stockAppliedSessions ?? [],
    toyOfWeek: data.toyOfWeek ?? { productId: "", blurb: "" },
    holiday: data.holiday ?? { enabled: false, until: "", message: "" },
    season: data.season ?? "auto",
    reviewSettings: data.reviewSettings ?? { enabled: true, blockedWords: [] },
    soldCounts: data.soldCounts ?? {},
    specialProductsAdded: true,
    specialsAdded: SPECIAL_PRODUCTS.map((p) => p.id),
  };
}

function hash(text: string): string {
  return crypto.createHash("sha1").update(text).digest("hex");
}

function readLocal(): { store: StoreData; version: string } {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return { store: withDefaults(JSON.parse(raw) as StoreData), version: hash(raw) };
}

// A connected Blob store provides either BLOB_STORE_ID (newer stores, which
// authenticate with Vercel's OIDC token) or BLOB_READ_WRITE_TOKEN; @vercel/blob
// picks up whichever is present.
export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
}

// Give up on storage after this long, so pages never hang if it's unreachable.
// (The Blob library keeps retrying and ignores abort signals, so race it.)
export const BLOB_TIMEOUT_MS = 8000;

export function withTimeout<T>(promise: Promise<T>, ms = BLOB_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Storage didn't answer in time.")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

// The file's ETag straight from the Blob API: the same value a conditional save
// checks. (The ETag on a downloaded copy can differ, e.g. when it's compressed,
// which made every save look like a clash.) Read it before the content, so a save
// in between makes our save safely fail and retry rather than overwrite.
export async function blobVersion(pathname: string): Promise<string | null> {
  try {
    return (await withTimeout(head(pathname))).etag;
  } catch (error) {
    if (error instanceof BlobNotFoundError) return null;
    throw error;
  }
}

// The free Vercel plan only allows so many storage reads a month, so shop pages
// don't read storage themselves. They share one copy kept in Next's cache (it
// outlives deploys and is shared by every server), which is thrown away the
// moment something is saved and otherwise refreshed about once an hour.
export const SHARED_CACHE_SECONDS = 60 * 60;
// Each server also remembers its last read briefly, so one page view is one lookup.
export const MEMORY_CACHE_MS = 15_000;
// While storage is unreachable, only try it again this often.
export const OFFLINE_RETRY_MS = 5 * 60_000;
const STORE_TAG = "htz-store";

// Throws away a shared copy after a save, so the next visit reads the new data.
export function expireShared(tag: string): void {
  try {
    revalidateTag(tag, { expire: 0 });
  } catch {
    // Not inside a request (nothing to expire from here); the copy refreshes on its own.
  }
}

class MissingFileError extends Error {}

// One storage read, always the latest saved file.
async function fetchStore(): Promise<StoreData> {
  const result = await withTimeout(get(BLOB_PATHNAME, { access: "private", useCache: false }));
  if (!result || result.statusCode !== 200) throw new MissingFileError();
  return JSON.parse(await new Response(result.stream).text()) as StoreData;
}

const fetchStoreShared = unstable_cache(fetchStore, [BLOB_PATHNAME], {
  tags: [STORE_TAG],
  revalidate: SHARED_CACHE_SECONDS,
});

// Pages and API routes are bundled separately, so this lives on globalThis:
// a save in the admin API then shows on the very next page view.
export function serverMemory<T>(key: string, initial: () => T): T {
  const all = ((globalThis as { __htzMemory?: Record<string, unknown> }).__htzMemory ??= {});
  return (all[key] ??= initial()) as T;
}

const state = serverMemory("store", () => ({
  memory: null as { store: StoreData; until: number } | null,
  reading: null as Promise<StoreData> | null,
  // True when the last read couldn't reach storage and showed the built-in copy.
  offline: false,
}));

function remember(store: StoreData, ms = MEMORY_CACHE_MS): StoreData {
  state.memory = { store, until: Date.now() + ms };
  return store;
}

export function storageOffline(): boolean {
  return state.offline;
}

// Reads through `fetch`; falls back to the built-in copy if storage can't be reached.
async function load(fetch: () => Promise<StoreData>): Promise<{ store: StoreData; offline: boolean }> {
  if (!blobConfigured()) return { store: readLocal().store, offline: false };
  try {
    const store = withDefaults(await fetch());
    state.offline = false;
    return { store: remember(store), offline: false };
  } catch (error) {
    // No file yet (first run on this project): create it from the bundled data.
    if (error instanceof MissingFileError) return { store: await seedStore(), offline: false };
    // Storage unavailable (e.g. paused by Vercel): show the built-in copy.
    console.error("Reading store from Vercel Blob failed:", error);
    state.offline = true;
    return { store: remember(readLocal().store, OFFLINE_RETRY_MS), offline: true };
  }
}

async function seedStore(): Promise<StoreData> {
  const seed = readLocal().store;
  await writeStore(seed);
  return seed;
}

// What shop pages use. On Vercel the filesystem is read-only, so data lives in
// Vercel Blob; locally, and until Blob is connected, it's the bundled data/store.json.
export function readStore(): Promise<StoreData> {
  if (state.memory && Date.now() < state.memory.until) return Promise.resolve(state.memory.store);
  // Everything asking at the same moment shares one read.
  state.reading ??= load(fetchStoreShared)
    .then((result) => result.store)
    .finally(() => {
      state.reading = null;
    });
  return state.reading;
}

// For the admin page: always the latest saved data (one storage read).
export function readStoreFresh(): Promise<{ store: StoreData; offline: boolean }> {
  return load(fetchStore);
}

// Reads the store plus a version (Blob ETag, or a hash of the local file) that
// a later write can check, so nobody overwrites changes they haven't seen.
// Only used when saving: it costs two storage requests.
async function readStoreVersioned(): Promise<{ store: StoreData; version: string | null }> {
  if (!blobConfigured()) return readLocal();
  const version = await blobVersion(BLOB_PATHNAME);
  if (!version) return { store: readLocal().store, version: null };
  return { store: withDefaults(await fetchStore()), version };
}

// Saves the store and returns its new version. With expectedVersion, the save
// only happens if nobody else saved since that version was read.
export async function writeStore(data: StoreData, expectedVersion?: string | null): Promise<string> {
  const json = JSON.stringify(data, null, 2) + "\n";

  if (!blobConfigured()) {
    if (process.env.VERCEL) {
      throw new Error(
        "Saving isn't set up: connect a Vercel Blob store to this project, then redeploy."
      );
    }
    if (expectedVersion && readLocal().version !== expectedVersion) {
      throw new StoreConflictError();
    }
    fs.writeFileSync(DATA_FILE, json);
    return hash(json);
  }

  try {
    const result = await withTimeout(
      put(BLOB_PATHNAME, json, {
        access: "private",
        addRandomSuffix: false,
        // No expected version means "create it" (first run) or "save regardless".
        allowOverwrite: true,
        contentType: "application/json",
        ...(expectedVersion ? { ifMatch: expectedVersion } : {}),
      })
    );
    state.offline = false;
    remember(data);
    expireShared(STORE_TAG);
    return result.etag;
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError) throw new StoreConflictError();
    throw error;
  }
}

// Read-change-write that retries if someone else saved in between. `change`
// may run more than once; it can throw (e.g. StoreConflictError) to cancel.
// The last try saves without the file check, in case the check itself misbehaves.
export async function updateStore(change: (store: StoreData) => StoreData): Promise<StoreData> {
  for (let attempt = 1; ; attempt++) {
    const { store, version } = await readStoreVersioned();
    const next = change(store);
    // Nothing to change: don't spend a storage write.
    if (next === store) return store;
    try {
      await writeStore(next, attempt === WRITE_ATTEMPTS ? undefined : version);
      return next;
    } catch (error) {
      if (!(error instanceof StoreConflictError) || attempt === WRITE_ATTEMPTS) throw error;
    }
  }
}
