import crypto from "crypto";
import { jsonFile } from "./json-file";
import type { WheelPrizeKey } from "./wheel";

// Who has spun the wheel, kept on the server so refreshing, clearing the
// browser or a private window can't give extra spins.
export type SpinRecord = { at: number; prize: WheelPrizeKey; code: string | null };
type Spins = Record<string, SpinRecord>;

const MAX_RECORDS = 5000;
const AGAIN_WAIT_MS = 24 * 60 * 60 * 1000;

const file = jsonFile<Spins>({
  blobPathname: "hugostoyz/spins.json",
  localFile: "spins.json",
  empty: () => ({}),
  normalise: (raw) => (raw && typeof raw === "object" ? (raw as Spins) : {}),
});

// A visitor is their internet address plus browser, scrambled so it can't be read back.
export function visitorId(request: Request): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const agent = request.headers.get("user-agent") ?? "";
  return crypto.createHash("sha256").update(`htz-spin:${ip}:${agent}`).digest("hex").slice(0, 32);
}

// Can this spin record still block a new spin?
export function stillCounts(record: SpinRecord | undefined): record is SpinRecord {
  if (!record) return false;
  return record.prize !== "again" || Date.now() - record.at < AGAIN_WAIT_MS;
}

export async function getSpin(id: string): Promise<SpinRecord | null> {
  const record = (await file.read())[id];
  return stillCounts(record) ? record : null;
}

// Saves a spin unless this visitor already has one; returns the existing one if so.
export async function claimSpin(id: string, record: SpinRecord): Promise<SpinRecord | null> {
  const existing = await file.update<SpinRecord | null>((spins) => {
    if (stillCounts(spins[id])) return { data: spins, result: spins[id] };
    const entries = Object.entries({ ...spins, [id]: record });
    // Keep the newest records only.
    const trimmed = entries.length > MAX_RECORDS ? entries.sort((a, b) => b[1].at - a[1].at).slice(0, MAX_RECORDS) : entries;
    return { data: Object.fromEntries(trimmed), result: null };
  });
  return existing ?? null;
}

export async function setSpinCode(id: string, code: string): Promise<void> {
  await file.update((spins) => (spins[id] ? { data: { ...spins, [id]: { ...spins[id], code } } } : { data: spins }));
}

export async function releaseSpin(id: string): Promise<void> {
  await file.update((spins) => {
    const next = { ...spins };
    delete next[id];
    return { data: next };
  });
}
