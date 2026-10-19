import fs from "fs";
import path from "path";
import { get, put } from "@vercel/blob";
import type { BannerSettings, SocialLinks, StoreData } from "./product-types";
import { DEFAULT_FAQS } from "./default-faqs";
import { NON_RETURNABLE_CATEGORY } from "./site";

const DATA_FILE = path.join(process.cwd(), "data", "store.json");
const BLOB_PATHNAME = "hugostoyz/store.json";

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

// Data saved before a field existed won't have it, so fill in defaults.
function withDefaults(data: StoreData): StoreData {
  return {
    ...data,
    products: data.products.map((product) => ({
      ...product,
      stock: product.stock ?? "made-to-order",
      gallery: product.gallery ?? [],
      badge: product.badge ?? "",
      needsCustomText: product.needsCustomText ?? product.category === NON_RETURNABLE_CATEGORY,
    })),
    banner: { ...DEFAULT_BANNER, ...data.banner },
    heroImage: data.heroImage ?? "",
    reviews: data.reviews ?? [],
    faqs: data.faqs ?? DEFAULT_FAQS,
    socialLinks: { ...DEFAULT_SOCIAL_LINKS, ...data.socialLinks },
  };
}

function readSeed(): StoreData {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return withDefaults(JSON.parse(raw) as StoreData);
}

// A connected Blob store provides either BLOB_STORE_ID (newer stores, which
// authenticate with Vercel's OIDC token) or BLOB_READ_WRITE_TOKEN; @vercel/blob
// picks up whichever is present.
export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
}

// On Vercel the filesystem is read-only, so data lives in Vercel Blob. Locally,
// and until Blob is connected, it falls back to the bundled data/store.json.
export async function readStore(): Promise<StoreData> {
  if (!blobConfigured()) {
    return readSeed();
  }

  try {
    const result = await get(BLOB_PATHNAME, { access: "private", useCache: false });
    if (result && result.statusCode === 200) {
      const text = await new Response(result.stream).text();
      return withDefaults(JSON.parse(text) as StoreData);
    }
  } catch (error) {
    console.error("Reading store from Vercel Blob failed:", error);
    return readSeed();
  }

  // No blob yet (first run on this project) - seed it from the bundled data.
  const seed = readSeed();
  await writeStore(seed);
  return seed;
}

export async function writeStore(data: StoreData): Promise<void> {
  if (!blobConfigured()) {
    if (process.env.VERCEL) {
      throw new Error(
        "Saving isn't set up: connect a Vercel Blob store to this project, then redeploy."
      );
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + "\n");
    return;
  }

  await put(BLOB_PATHNAME, JSON.stringify(data, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}
