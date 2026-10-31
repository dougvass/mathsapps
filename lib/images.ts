import crypto from "crypto";
import fs from "fs";
import path from "path";
import { get, put } from "@vercel/blob";
import { blobConfigured, withTimeout } from "./store";

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const LOCAL_DIR = path.join(process.cwd(), ".uploads");
const BLOB_PREFIX = "images/";
const PUBLIC_PREFIX = "/api/images/";

const TYPES = {
  webp: "image/webp",
  jpg: "image/jpeg",
  png: "image/png",
} as const;
type Ext = keyof typeof TYPES;

// Image names are generated server-side, so anything else is rejected. This
// also keeps the image route from ever reading the private store data.
const NAME_PATTERN = /^[a-f0-9-]{36}\.(webp|jpg|png)$/;

function detectExt(bytes: Uint8Array): Ext | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return "png";
  return null;
}

// Shrinks big photos and turns them into WebP so pages load faster.
// If that fails for any reason, the original is kept.
async function optimise(bytes: Uint8Array): Promise<Uint8Array> {
  try {
    const sharp = (await import("sharp")).default;
    const output = await sharp(bytes)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    return output.byteLength < bytes.byteLength ? new Uint8Array(output) : bytes;
  } catch (error) {
    console.error("Optimising image failed:", error);
    return bytes;
  }
}

// A smaller copy for tiles and thumbnails (null if it can't be made).
export async function resizeImage(source: Buffer, width: number): Promise<Buffer | null> {
  try {
    const sharp = (await import("sharp")).default;
    return await sharp(source).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  } catch (error) {
    console.error("Resizing image failed:", error);
    return null;
  }
}

export async function saveImage(original: Uint8Array): Promise<string> {
  if (!detectExt(original)) {
    throw new Error("Please upload a JPEG, PNG or WebP image.");
  }
  const bytes = await optimise(original);
  const ext = detectExt(bytes)!;

  const name = `${crypto.randomUUID()}.${ext}`;

  if (blobConfigured()) {
    await put(BLOB_PREFIX + name, Buffer.from(bytes), {
      access: "private",
      addRandomSuffix: false,
      contentType: TYPES[ext],
    });
  } else {
    if (process.env.VERCEL) {
      throw new Error(
        "Saving isn't set up: connect a Vercel Blob store to this project, then redeploy."
      );
    }
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOCAL_DIR, name), bytes);
  }

  return PUBLIC_PREFIX + name;
}

export async function loadImage(
  name: string
): Promise<{ body: ReadableStream<Uint8Array> | Buffer; contentType: string } | null> {
  if (!NAME_PATTERN.test(name)) return null;
  const contentType = TYPES[name.split(".").pop() as Ext];

  if (blobConfigured()) {
    const result = await withTimeout(get(BLOB_PREFIX + name, { access: "private" })).catch(() => null);
    if (!result || result.statusCode !== 200) return null;
    return { body: result.stream, contentType };
  }

  const file = path.join(LOCAL_DIR, name);
  if (!fs.existsSync(file)) return null;
  return { body: fs.readFileSync(file), contentType };
}
