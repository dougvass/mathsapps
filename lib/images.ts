import crypto from "crypto";
import fs from "fs";
import path from "path";
import { get, put } from "@vercel/blob";
import { blobConfigured } from "./store";

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

export async function saveImage(bytes: Uint8Array): Promise<string> {
  const ext = detectExt(bytes);
  if (!ext) {
    throw new Error("Please upload a JPEG, PNG or WebP image.");
  }

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
    const result = await get(BLOB_PREFIX + name, { access: "private" });
    if (!result || result.statusCode !== 200) return null;
    return { body: result.stream, contentType };
  }

  const file = path.join(LOCAL_DIR, name);
  if (!fs.existsSync(file)) return null;
  return { body: fs.readFileSync(file), contentType };
}
