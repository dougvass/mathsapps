import type { StlInfo } from "./stl";

// Prices for printing a customer's own 3D file.
export const PRINT_BASE_CENTS = 500;
export const PRINT_CENTS_PER_CM3 = 15;
export const PRINT_MIN_CENTS = 800;
export const PRINT_MAX_VOLUME_CM3 = 1000;
export const PRINT_MIN_SIZE_MM = 5;
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // after compression
export const MAX_STL_BYTES = 40 * 1024 * 1024;

export type PrintQuote =
  | { ok: true; priceCents: number; volumeCm3: number; sizeMm: [number, number, number] }
  | { ok: false; reason: string };

// Rounds to the nearest 50c.
function roundPrice(cents: number): number {
  return Math.round(cents / 50) * 50;
}

export function quotePrint(info: StlInfo, maxBuildMm: number): PrintQuote {
  const sizeMm = info.sizeMm.map((n) => Math.round(n * 10) / 10) as [number, number, number];
  const biggest = Math.max(...sizeMm);
  if (biggest > maxBuildMm) {
    return { ok: false, reason: `It's ${Math.round(biggest)}mm long – our printer fits up to ${maxBuildMm}mm. Try scaling it down.` };
  }
  if (biggest < PRINT_MIN_SIZE_MM) {
    return { ok: false, reason: "It's tiny – under 5mm. Is it in inches or metres? Please export it in millimetres." };
  }
  if (info.volumeCm3 > PRINT_MAX_VOLUME_CM3) {
    return { ok: false, reason: "That's a really big print! Please email us for a custom quote." };
  }
  const volumeCm3 = Math.round(info.volumeCm3 * 10) / 10;
  const priceCents = Math.max(PRINT_MIN_CENTS, roundPrice(PRINT_BASE_CENTS + info.volumeCm3 * PRINT_CENTS_PER_CM3));
  return { ok: true, priceCents, volumeCm3, sizeMm };
}
