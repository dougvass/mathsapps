import fs from "fs";
import path from "path";
import { BlobPreconditionFailedError, get, put } from "@vercel/blob";
import type { Review } from "./product-types";
import { blobConfigured, readStore } from "./store";

// Reviews live in their own file, separate from the rest of the store, so
// customers posting reviews and the admin saving products never overwrite
// each other's changes.
const BLOB_PATHNAME = "hugostoyz/reviews.json";
const LOCAL_FILE = path.join(process.cwd(), ".local-data", "reviews.json");
const MAX_STORED_REVIEWS = 500;
const WRITE_ATTEMPTS = 5;

type Loaded = { reviews: Review[]; etag: string | null };

function normalise(reviews: Partial<Review>[]): Review[] {
  return reviews.map((review) => ({
    id: String(review.id),
    name: String(review.name ?? ""),
    text: String(review.text ?? ""),
    rating: Number(review.rating ?? 5),
    createdAt: review.createdAt ?? "",
  }));
}

// Reviews added in the admin panel before reviews had their own file.
async function legacyReviews(): Promise<Review[]> {
  const store = (await readStore()) as { reviews?: Partial<Review>[] };
  return normalise(store.reviews ?? []);
}

async function load(): Promise<Loaded> {
  if (!blobConfigured()) {
    if (!fs.existsSync(LOCAL_FILE)) return { reviews: await legacyReviews(), etag: null };
    return { reviews: normalise(JSON.parse(fs.readFileSync(LOCAL_FILE, "utf-8"))), etag: null };
  }

  const result = await get(BLOB_PATHNAME, { access: "private", useCache: false });
  if (result && result.statusCode === 200) {
    const text = await new Response(result.stream).text();
    return { reviews: normalise(JSON.parse(text)), etag: result.blob.etag };
  }
  return { reviews: await legacyReviews(), etag: null };
}

export async function getReviews(): Promise<Review[]> {
  try {
    return (await load()).reviews;
  } catch (error) {
    console.error("Reading reviews failed:", error);
    return [];
  }
}

// Read-change-write that retries if someone else saved in between.
export async function updateReviews(change: (reviews: Review[]) => Review[]): Promise<void> {
  if (!blobConfigured()) {
    if (process.env.VERCEL) {
      throw new Error("Saving isn't set up: connect a Vercel Blob store to this project.");
    }
    const next = change((await load()).reviews).slice(0, MAX_STORED_REVIEWS);
    fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(next, null, 2));
    return;
  }

  for (let attempt = 1; attempt <= WRITE_ATTEMPTS; attempt++) {
    const { reviews, etag } = await load();
    const next = change(reviews).slice(0, MAX_STORED_REVIEWS);
    try {
      await put(BLOB_PATHNAME, JSON.stringify(next, null, 2), {
        access: "private",
        addRandomSuffix: false,
        contentType: "application/json",
        // First write creates the file; later writes only succeed if nobody
        // changed it since we read it.
        ...(etag ? { allowOverwrite: true, ifMatch: etag } : { allowOverwrite: false }),
      });
      return;
    } catch (error) {
      // Someone saved first (changed ETag, or created the file before us): retry.
      const conflict = error instanceof BlobPreconditionFailedError || !etag;
      if (!conflict || attempt === WRITE_ATTEMPTS) throw error;
    }
  }
}
