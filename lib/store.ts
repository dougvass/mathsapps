import fs from "fs";
import path from "path";
import { get, put } from "@vercel/blob";
import type { StoreData } from "./product-types";

const DATA_FILE = path.join(process.cwd(), "data", "store.json");
const BLOB_PATHNAME = "hugostoyz/store.json";

function readSeed(): StoreData {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw) as StoreData;
}

// On Vercel, the production filesystem is read-only, so writes go to Vercel
// Blob instead (enabled by connecting a Blob store, which provides
// BLOB_READ_WRITE_TOKEN). Locally, and until Blob is connected, everything
// falls back to the bundled data/store.json file on disk.
export async function readStore(): Promise<StoreData> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return readSeed();
  }

  try {
    const result = await get(BLOB_PATHNAME, { access: "private", token, useCache: false });
    if (result && result.statusCode === 200) {
      const text = await new Response(result.stream).text();
      return JSON.parse(text) as StoreData;
    }
  } catch {
    return readSeed();
  }

  // No blob yet (first run on this project) - seed it from the bundled data.
  const seed = readSeed();
  await writeStore(seed);
  return seed;
}

export async function writeStore(data: StoreData): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + "\n");
    return;
  }

  await put(BLOB_PATHNAME, JSON.stringify(data, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    token,
  });
}
