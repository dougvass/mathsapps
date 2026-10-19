"use client";

import { useRef, useState } from "react";

// Downscale before upload so large phone photos stay well under Vercel's
// request size limit and load quickly in the shop.
async function shrinkImage(file: File, maxDimension: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const encode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  // Safari can't encode WebP and silently returns PNG, so fall back to JPEG.
  const webp = await encode("image/webp");
  if (webp?.type === "image/webp") return webp;
  const jpeg = await encode("image/jpeg");
  if (!jpeg) throw new Error("Couldn't process that image.");
  return jpeg;
}

export default function ImageDropzone({
  value,
  onChange,
  maxDimension,
  aspectClass = "aspect-square",
  emptyLabel = "Drop an image here, or click to choose",
}: {
  value: string;
  onChange: (url: string) => void;
  maxDimension: number;
  aspectClass?: string;
  emptyLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That file isn't an image.");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const blob = await shrinkImage(file, maxDimension);
      const form = new FormData();
      form.append("file", blob, "upload");
      const response = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Upload failed.");
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files[0]);
        }}
        className={`relative flex ${aspectClass} w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
          dragging
            ? "border-htz-orange bg-htz-orange/10"
            : "border-htz-navy/20 bg-htz-cream hover:border-htz-orange"
        }`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="px-4 text-center text-sm text-htz-navy/60">{emptyLabel}</span>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-semibold text-htz-navy">
            Uploading…
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {value && (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-semibold text-htz-navy hover:underline"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="font-semibold text-htz-pink hover:underline"
            >
              Remove
            </button>
          </>
        )}
        {error && <span className="font-semibold text-htz-pink">{error}</span>}
      </div>
    </div>
  );
}
