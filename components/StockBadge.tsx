import type { StockLevel } from "@/lib/product-types";

export default function StockBadge({ stock }: { stock: StockLevel }) {
  const [label, style] =
    stock === "out-of-stock"
      ? ["Out of stock", "bg-htz-pink/10 text-htz-pink"]
      : stock === "made-to-order"
        ? ["Made to order", "bg-htz-navy/5 text-htz-navy/70"]
        : [`${stock} in stock`, "bg-htz-teal/10 text-htz-teal"];

  return (
    <span className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}
