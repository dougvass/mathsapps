import fs from "fs";
import path from "path";
import { get, put } from "@vercel/blob";
import type { BannerSettings, StoreData } from "./product-types";

const DATA_FILE = path.join(process.cwd(), "data", "store.json");
const BLOB_PATHNAME = "hugostoyz/store.json";

const DEFAULT_BANNER: BannerSettings = {
  enabled: false,
  image: "",
  headline: "Sale Now On",
  subtext: "Bonus on your first order",
};

// Data saved before a field existed won't have it, so fill in defaults.
function withDefaults(data: StoreData): StoreData {
  return { ...data, banner: { ...DEFAULT_BANNER, ...data.banner } };
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
