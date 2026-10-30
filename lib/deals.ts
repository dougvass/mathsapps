import { FILE_PRINT_ID, GIFT_CARD_ID } from "./product-types";

// Automatic bundle deal: buy enough toys and each one is cheaper.
export const BUNDLE_MIN_TOYS = 3;
export const BUNDLE_PERCENT_OFF = 10;
export const GIFT_WRAP_CENTS = 200;
export const GIFT_MESSAGE_MAX = 200;

type DealLine = { productId: string; quantity: number; unitCents: number };

// Printing a customer's own file and gift cards aren't toys, so they don't count.
export function countsForBundle(line: { productId: string }): boolean {
  return line.productId !== FILE_PRINT_ID && line.productId !== GIFT_CARD_ID;
}

export function bundleApplies(lines: DealLine[]): boolean {
  return lines.filter(countsForBundle).reduce((sum, line) => sum + line.quantity, 0) >= BUNDLE_MIN_TOYS;
}

// Unit price after the bundle deal (same rounding on the cart page and at checkout).
export function bundledUnitCents(line: DealLine, applies: boolean): number {
  if (!applies || !countsForBundle(line)) return line.unitCents;
  return Math.round((line.unitCents * (100 - BUNDLE_PERCENT_OFF)) / 100);
}

export function bundleSavingCents(lines: DealLine[]): number {
  const applies = bundleApplies(lines);
  return lines.reduce((sum, line) => sum + line.quantity * (line.unitCents - bundledUnitCents(line, applies)), 0);
}
