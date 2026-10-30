import crypto from "crypto";
import fs from "fs";
import path from "path";
import { BlobPreconditionFailedError, get, put } from "@vercel/blob";
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

// Reads the store plus a version (Blob ETag, or a hash of the local file) that
// a later write can check, so nobody overwrites changes they haven't seen.
export async function readStoreVersioned(): Promise<{ store: StoreData; version: string | null }> {
  if (!blobConfigured()) {
    return readLocal();
  }

  try {
    const result = await get(BLOB_PATHNAME, { access: "private", useCache: false });
    if (result && result.statusCode === 200) {
      const text = await new Response(result.stream).text();
      return { store: withDefaults(JSON.parse(text) as StoreData), version: result.blob.etag };
    }
  } catch (error) {
    console.error("Reading store from Vercel Blob failed:", error);
    return { store: readLocal().store, version: null };
  }

  // No blob yet (first run on this project) - seed it from the bundled data.
  const seed = readLocal().store;
  const version = await writeStore(seed);
  return { store: seed, version };
}

// On Vercel the filesystem is read-only, so data lives in Vercel Blob. Locally,
// and until Blob is connected, it falls back to the bundled data/store.json.
export async function readStore(): Promise<StoreData> {
  return (await readStoreVersioned()).store;
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
    const result = await put(BLOB_PATHNAME, json, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      ...(expectedVersion ? { ifMatch: expectedVersion } : {}),
    });
    return result.etag;
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError) throw new StoreConflictError();
    throw error;
  }
}

// Read-change-write that retries if someone else saved in between. Used for
// automatic changes (sales, password) that don't need a person to re-check.
export async function updateStore(change: (store: StoreData) => StoreData): Promise<void> {
  for (let attempt = 1; attempt <= WRITE_ATTEMPTS; attempt++) {
    const { store, version } = await readStoreVersioned();
    try {
      await writeStore(change(store), version);
      return;
    } catch (error) {
      if (!(error instanceof StoreConflictError) || attempt === WRITE_ATTEMPTS) throw error;
    }
  }
}
