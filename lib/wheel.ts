// Spin-the-wheel prizes, in the order they appear on the wheel.
export const WHEEL_PRIZES = [
  { key: "pct5", label: "5% off", colour: "#ff6a1a", weight: 35 },
  { key: "ship", label: "Free shipping", colour: "#103c45", weight: 20 },
  { key: "pct10", label: "10% off", colour: "#ff4d94", weight: 15 },
  { key: "points", label: "20 points", colour: "#7c3aed", weight: 15 },
  { key: "again", label: "Try again tomorrow", colour: "#64748b", weight: 15 },
] as const;

export type WheelPrizeKey = (typeof WHEEL_PRIZES)[number]["key"];
export const WHEEL_POINTS = 20;
export const WHEEL_CODE_DAYS = 7;
