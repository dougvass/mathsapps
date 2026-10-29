"use client";

import { useState } from "react";
import { MAX_STOCK, type StockLevel } from "@/lib/product-types";

const fieldClass =
  "rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none";

export default function StockEditor({
  stock,
  onChange,
}: {
  stock: StockLevel;
  onChange: (stock: StockLevel) => void;
}) {
  const mode = typeof stock === "number" ? "count" : stock;
  // Text kept separately so the box can be cleared while retyping a number.
  const [text, setText] = useState(typeof stock === "number" ? String(stock) : "1");
  const count = Number(text);
  const valid = Number.isInteger(count) && count >= 1 && count <= MAX_STOCK;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-htz-navy">Stock</span>
      <div className="flex gap-2">
        <select
          value={mode}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "count") onChange(valid ? count : 1);
            else onChange(value as StockLevel);
          }}
          className={`${fieldClass} flex-1`}
          aria-label="Stock type"
        >
          <option value="count">In stock</option>
          <option value="made-to-order">Made to order</option>
          <option value="out-of-stock">Out of stock</option>
        </select>
        {mode === "count" && (
          <input
            type="number"
            min={1}
            max={MAX_STOCK}
            step={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              const next = Number(e.target.value);
              if (Number.isInteger(next) && next >= 1 && next <= MAX_STOCK) onChange(next);
            }}
            aria-label="How many in stock"
            className={`${fieldClass} w-24 ${valid ? "" : "border-htz-pink"}`}
          />
        )}
      </div>
      {mode === "count" && typeof stock === "number" && stock <= 2 && (
        <span className="text-xs font-semibold text-htz-orange">Low stock – only {stock} left</span>
      )}
      {mode === "count" && !valid && (
        <span className="text-xs text-htz-pink">Enter a whole number from 1 to {MAX_STOCK}.</span>
      )}
    </div>
  );
}
