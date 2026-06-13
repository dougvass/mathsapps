import crypto from "crypto";
import { readStore, writeStore } from "./store";

export const ADMIN_SESSION_COOKIE = "htz_admin_session";

const SCRYPT_KEYLEN = 64;

function createSessionToken(secret: string): string {
  return crypto.createHmac("sha256", secret).update("htz-admin-session").digest("hex");
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPasswordHash(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return timingSafeEqualStrings(candidate, hash);
}

// Checks the login password against the stored, changeable password hash.
// If no password has been set yet, falls back to the ADMIN_PASSWORD env var
// so the admin panel works out of the box.
export async function checkAdminPassword(password: string): Promise<boolean> {
  if (!password) return false;

  const store = await readStore();
  if (store.adminPasswordHash) {
    return verifyPasswordHash(password, store.adminPasswordHash);
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return timingSafeEqualStrings(password, adminPassword);
}

export async function setAdminPassword(newPassword: string): Promise<void> {
  const store = await readStore();
  await writeStore({ ...store, adminPasswordHash: hashPassword(newPassword) });
}

// Session cookies are signed with ADMIN_PASSWORD as a stable secret, kept
// separate from the changeable login password above.
export function getSessionToken(): string | null {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return null;
  return createSessionToken(secret);
}

export function isValidSessionToken(token: string | undefined): boolean {
  const expected = getSessionToken();
  if (!expected || !token) return false;
  return timingSafeEqualStrings(token, expected);
}
