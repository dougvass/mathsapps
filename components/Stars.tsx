// Star rating that can show part-stars (e.g. 4.5), with an optional review count.
export default function Stars({
  rating,
  count,
  size = "text-sm",
}: {
  rating: number;
  count?: number;
  size?: string;
}) {
  const percent = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span className={`inline-flex items-center gap-1 ${size}`}>
      <span className="relative inline-block leading-none tracking-wide" aria-label={`${rating.toFixed(1)} out of 5 stars`} role="img">
        <span className="text-htz-navy/15">★★★★★</span>
        <span className="absolute inset-0 overflow-hidden text-htz-orange" style={{ width: `${percent}%` }}>
          ★★★★★
        </span>
      </span>
      {count !== undefined && <span className="text-xs text-htz-teal">({count})</span>}
    </span>
  );
}
