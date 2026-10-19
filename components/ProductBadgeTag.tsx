import { BADGE_LABELS, type ProductBadge } from "@/lib/product-types";

const STYLES: Record<Exclude<ProductBadge, "">, string> = {
  new: "bg-htz-lime text-htz-navy",
  bestseller: "bg-htz-pink text-white",
};

export default function ProductBadgeTag({
  badge,
  className = "",
}: {
  badge: ProductBadge;
  className?: string;
}) {
  if (!badge) return null;
  return (
    <span
      className={`rounded-full px-3 py-1 font-display text-xs font-bold uppercase tracking-wide shadow ${STYLES[badge]} ${className}`}
    >
      {BADGE_LABELS[badge]}
    </span>
  );
}
