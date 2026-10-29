"use client";

import { useRef, useState } from "react";
import type { Product } from "@/lib/product-types";
import { useCart } from "@/lib/cart-context";
import { useShop } from "@/lib/shop-context";
import { measureStl } from "@/lib/stl";
import { MAX_STL_BYTES, MAX_UPLOAD_BYTES, PRINT_CENTS_PER_CM3, PRINT_BASE_CENTS, PRINT_MIN_CENTS } from "@/lib/print-pricing";
import type { PrintFile } from "@/lib/print-files";

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

async function gzip(file: File): Promise<Blob> {
  const stream = file.stream().pipeThrough(new CompressionStream("gzip"));
  return new Response(stream).blob();
}

// Upload an STL, get it scanned and priced, then add it to the cart.
export default function PrintYourFile({ product }: { product: Product }) {
  const { colors } = useShop();
  const { addItem } = useCart();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState<"idle" | "scanning" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<PrintFile | null>(null);
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setQuote(null);
    setAdded(false);
    if (!file.name.toLowerCase().endsWith(".stl")) {
      setError("Please choose an .stl file (most 3D design apps can export one).");
      return;
    }
    if (file.size > MAX_STL_BYTES) {
      setError("That file is over 40MB. Try exporting it with fewer details.");
      return;
    }
    setStep("scanning");
    try {
      // Quick check in the browser first, so obvious problems show straight away.
      measureStl(new Uint8Array(await file.arrayBuffer()));
      const compressed = await gzip(file);
      if (compressed.size > MAX_UPLOAD_BYTES) {
        setError("That file is too detailed to upload. Try exporting it with fewer details.");
        setStep("idle");
        return;
      }
      const response = await fetch("/api/print-files", {
        method: "POST",
        headers: { "Content-Type": "application/gzip", "x-file-name": encodeURIComponent(file.name).slice(0, 200) },
        body: compressed,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Couldn't scan that file.");
      setQuote(data.file);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't scan that file.");
      setStep("idle");
    }
  }

  function addToCart() {
    if (!quote || (product.chooseColor && !color)) return;
    const [x, y, z] = quote.sizeMm.map((n) => Math.round(n));
    addItem(
      { productId: product.id, color: product.chooseColor ? color : "", size: "", customText: "", extra: quote.id },
      quantity,
      { label: `File: ${quote.name} · ${x}×${y}×${z}mm`, unitCents: quote.priceCents }
    );
    setAdded(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        className={`flex flex-col items-center gap-2 rounded-2xl border-4 border-dashed p-8 text-center transition-colors ${dragging ? "border-htz-orange bg-htz-orange/10" : "border-ink/20 bg-surface-2/60 hover:border-htz-orange"}`}
      >
        <span className="text-5xl" aria-hidden="true">{step === "scanning" ? "🔍" : "📦"}</span>
        <span className="font-display text-xl font-bold text-ink">
          {step === "scanning" ? "Scanning your file…" : quote ? "Upload a different file" : "Drop your STL file here"}
        </span>
        <span className="text-sm text-ink/60">or tap to choose one · in millimetres · up to 40MB</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".stl,model/stl,application/sla"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
        aria-label="Choose an STL file"
      />

      {error && <p className="rounded-xl bg-htz-pink/10 p-3 text-sm font-semibold text-htz-pink" role="alert">{error}</p>}

      {quote && (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-htz-teal/30 bg-surface p-4">
          <p className="font-semibold text-green-700">✓ Scanned {quote.name} – it fits our printer!</p>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-surface-2 p-2">
              <dt className="text-ink/60">Size</dt>
              <dd className="font-semibold text-ink">
                {quote.sizeMm.map((n) => Math.round(n)).join(" × ")} mm
              </dd>
            </div>
            <div className="rounded-lg bg-surface-2 p-2">
              <dt className="text-ink/60">Plastic</dt>
              <dd className="font-semibold text-ink">{quote.volumeCm3} cm³</dd>
            </div>
          </dl>
          <p className="font-display text-3xl font-bold text-ink">
            {money(quote.priceCents)} <span className="text-sm font-normal text-ink/50">each</span>
          </p>
          {product.chooseColor && (
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
              Colour
              <select value={color} onChange={(e) => setColor(e.target.value)} className="rounded-lg border border-ink/20 px-3 py-2">
                <option value="">Choose a colour…</option>
                {colors.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          )}
          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            Qty
            <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-20 rounded-lg border border-ink/20 px-3 py-2" aria-label="Quantity">
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={addToCart}
            disabled={product.chooseColor && !color}
            className="rounded-full bg-htz-lime py-3 font-display text-lg font-bold text-htz-navy shadow transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {added ? "✓ Added – add again?" : "Add to Cart"}
          </button>
          {product.chooseColor && !color && <p className="text-center text-xs text-ink/60">Choose a colour first.</p>}
        </div>
      )}

      <div className="rounded-xl bg-surface-2/60 p-3 text-sm text-ink/70">
        <p className="font-semibold text-ink">How the price works</p>
        <p>
          Our scanner measures how much plastic your model needs: {money(PRINT_BASE_CENTS)} to set up the printer, plus{" "}
          {PRINT_CENTS_PER_CM3}c per cm³ (at least {money(PRINT_MIN_CENTS)}). Custom prints can&apos;t be returned for a change of mind.
        </p>
      </div>
    </div>
  );
}
