import crypto from "crypto";

export const ADMIN_SESSION_COOKIE = "htz_admin_session";

function createSessionToken(adminPassword: string): string {
  return crypto.createHmac("sha256", adminPassword).update("htz-admin-session").digest("hex");
}

export function checkAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || !password) return false;

  const a = Buffer.from(password);
  const b = Buffer.from(adminPassword);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function getSessionToken(): string | null {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return null;
  return createSessionToken(adminPassword);
}

export function isValidSessionToken(token: string | undefined): boolean {
  const expected = getSessionToken();
  if (!expected || !token) return false;

  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
