import { NextResponse } from "next/server";
import { gunzipSync } from "zlib";
import { measureStl } from "@/lib/stl";
import { MAX_STL_BYTES, MAX_UPLOAD_BYTES, quotePrint } from "@/lib/print-pricing";
import { safeFileName, savePrintFile } from "@/lib/print-files";
import { readStore } from "@/lib/store";
import { tooManyAttempts, visitorKey } from "@/lib/rate-limit";

function fileNameFrom(request: Request): string {
  try {
    return decodeURIComponent(request.headers.get("x-file-name") ?? "model.stl");
  } catch {
    return "model.stl";
  }
}

// Takes a gzipped STL, measures it, and saves it with its price.
export async function POST(request: Request) {
  if (tooManyAttempts(`print-upload:${visitorKey(request)}`, 15, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many uploads. Please try again in a while." }, { status: 429 });
  }
  const gzipped = Buffer.from(await request.arrayBuffer());
  if (gzipped.byteLength === 0) return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (gzipped.byteLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "That file is too big to upload. Try simplifying it." }, { status: 413 });
  }

  let stl: Buffer;
  try {
    stl = gunzipSync(gzipped, { maxOutputLength: MAX_STL_BYTES });
  } catch {
    return NextResponse.json({ error: "That file is too big or couldn't be read." }, { status: 400 });
  }

  let quote;
  try {
    const store = await readStore();
    quote = quotePrint(measureStl(new Uint8Array(stl)), store.settings.printerMaxBuildMm);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Couldn't read that file.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  if (!quote.ok) return NextResponse.json({ error: quote.reason }, { status: 400 });

  try {
    const record = await savePrintFile(gzipped, {
      name: safeFileName(fileNameFrom(request)),
      priceCents: quote.priceCents,
      volumeCm3: quote.volumeCm3,
      sizeMm: quote.sizeMm,
    });
    return NextResponse.json({ file: record });
  } catch (error) {
    console.error("Saving print file failed:", error);
    return NextResponse.json({ error: "Sorry, we couldn't save your file. Please try again." }, { status: 500 });
  }
}
