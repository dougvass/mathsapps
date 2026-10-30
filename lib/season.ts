// Christmas and Halloween decorations: automatic by date, or set in admin.
export type SeasonSetting = "auto" | "off" | "christmas" | "halloween";
export type Season = "christmas" | "halloween" | null;

export const SEASON_SETTINGS: { value: SeasonSetting; label: string }[] = [
  { value: "auto", label: "Automatic (Halloween in October, Christmas 1 Nov – 26 Dec)" },
  { value: "christmas", label: "Christmas now" },
  { value: "halloween", label: "Halloween now" },
  { value: "off", label: "Off" },
];

export function isSeasonSetting(value: unknown): value is SeasonSetting {
  return SEASON_SETTINGS.some((s) => s.value === value);
}

export function activeSeason(setting: SeasonSetting, now = new Date()): Season {
  if (setting === "off") return null;
  if (setting !== "auto") return setting;
  const parts = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", month: "numeric", day: "numeric" }).formatToParts(now);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  if (month === 10) return "halloween";
  if (month === 11 || (month === 12 && day <= 26)) return "christmas";
  return null;
}
