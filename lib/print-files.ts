import crypto from "crypto";
import fs from "fs";
import path from "path";
import { gunzipSync } from "zlib";
import { get, put } from "@vercel/blob";
import { blobConfigured } from "./store";

// Customers' uploaded 3D files (kept gzipped) and the quote worked out for each.
export type PrintFile = {
  id: string;
  name: string;
  priceCents: number;
  volumeCm3: number;
  sizeMm: [number, number, number];
  createdAt: string;
};

const PREFIX = "print-files/";
const LOCAL_DIR = path.join(process.cwd(), ".uploads", "print-files");
const ID_PATTERN = /^[a-f0-9-]{36}$/;

export function isPrintFileId(id: string): boolean {
  return ID_PATTERN.test(id);
}

async function write(name: string, body: Buffer, contentType: string) {
  if (blobConfigured()) {
    await put(PREFIX + name, body, { access: "private", addRandomSuffix: false, contentType });
    return;
  }
  if (process.env.VERCEL) throw new Error("Saving isn't set up: connect a Vercel Blob store.");
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
  fs.writeFileSync(path.join(LOCAL_DIR, name), body);
}

async function read(name: string): Promise<Buffer | null> {
  if (blobConfigured()) {
    const result = await get(PREFIX + name, { access: "private" });
    if (!result || result.statusCode !== 200) return null;
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  }
  const file = path.join(LOCAL_DIR, name);
  return fs.existsSync(file) ? fs.readFileSync(file) : null;
}

export async function savePrintFile(gzipped: Buffer, details: Omit<PrintFile, "id" | "createdAt">): Promise<PrintFile> {
  const record: PrintFile = { ...details, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  await write(`${record.id}.stl.gz`, gzipped, "application/gzip");
  await write(`${record.id}.json`, Buffer.from(JSON.stringify(record)), "application/json");
  return record;
}

export async function getPrintFile(id: string): Promise<PrintFile | null> {
  if (!isPrintFileId(id)) return null;
  const data = await read(`${id}.json`);
  return data ? (JSON.parse(data.toString()) as PrintFile) : null;
}

export async function getPrintFileStl(id: string): Promise<Buffer | null> {
  if (!isPrintFileId(id)) return null;
  const data = await read(`${id}.stl.gz`);
  return data ? gunzipSync(data) : null;
}

export function safeFileName(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9 ._()-]/g, "").trim().slice(0, 60);
  return cleaned.toLowerCase().endsWith(".stl") ? cleaned : `${cleaned || "model"}.stl`;
}
