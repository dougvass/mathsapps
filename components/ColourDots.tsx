"use client";

// Colour names (as set in admin) to what they look like. Unknown names get a
// neutral dot with the name written underneath.
const SWATCHES: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#facc15",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a855f7",
  pink: "#ec4899",
  black: "#111827",
  white: "#ffffff",
  grey: "#9ca3af",
  gray: "#9ca3af",
  brown: "#92400e",
  gold: "#d4a017",
  silver: "#c0c0c0",
  teal: "#14b8a6",
  rainbow: "conic-gradient(#ef4444, #f97316, #facc15, #22c55e, #3b82f6, #a855f7, #ef4444)",
  random: "conic-gradient(#ef4444, #f97316, #facc15, #22c55e, #3b82f6, #a855f7, #ef4444)",
};

function swatch(name: string): string {
  const key = name.toLowerCase();
  return SWATCHES[key] ?? Object.entries(SWATCHES).find(([word]) => key.includes(word))?.[1] ?? "#d1d5db";
}

// Tap a coloured circle to pick a colour.
export default function ColourDots({
  colours,
  value,
  onChange,
}: {
  colours: string[];
  value: string;
  onChange: (colour: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-ink">
        Colour{value ? <span className="font-normal text-ink/60">{`: ${value}`}</span> : <span className="font-normal text-ink/50"> – tap one</span>}
      </legend>
      <div className="flex flex-wrap gap-3">
        {colours.map((colour) => (
          <button
            key={colour}
            type="button"
            onClick={() => onChange(colour)}
            aria-pressed={value === colour}
            aria-label={colour}
            title={colour}
            className="flex w-14 flex-col items-center gap-1 text-xs text-ink/70"
          >
            <span
              className={`h-11 w-11 rounded-full border-2 shadow-sm transition-transform ${value === colour ? "scale-110 border-htz-orange ring-4 ring-htz-orange/30" : "border-ink/15 hover:scale-105"}`}
              style={{ background: swatch(colour) }}
            />
            <span className="w-full truncate text-center">{colour}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
