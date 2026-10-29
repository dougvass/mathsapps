import crypto from "crypto";
import { cookies } from "next/headers";

// Signed-in shopper session: "accountId.expiry.signature" in an httpOnly cookie.
export const USER_SESSION_COOKIE = "htz_user";
export const SESSION_DAYS = 60;
export const OAUTH_STATE_COOKIE = "htz_oauth";
// Set by a friend's referral link (see ReferralCatcher).
export const REFERRAL_COOKIE = "htz_ref";

// Only same-site paths, so sign-in can't be used to bounce people elsewhere.
export function safeNext(next: string | null): string {
  return next && /^\/(?![\/\\])/.test(next) ? next : "/account";
}

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function secret(): string | null {
  return process.env.AUTH_SECRET || process.env.GOOGLE_CLIENT_SECRET || null;
}

function sign(value: string, key: string): string {
  return crypto.createHmac("sha256", key).update(`htz-user:${value}`).digest("base64url");
}

export function createSessionValue(accountId: string): string | null {
  const key = secret();
  if (!key) return null;
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const value = `${accountId}.${expires}`;
  return `${value}.${sign(value, key)}`;
}

export function readSessionValue(cookie: string | undefined): string | null {
  const key = secret();
  if (!key || !cookie) return null;
  const lastDot = cookie.lastIndexOf(".");
  const value = cookie.slice(0, lastDot);
  const signature = Buffer.from(cookie.slice(lastDot + 1));
  const expected = Buffer.from(sign(value, key));
  if (signature.length !== expected.length || !crypto.timingSafeEqual(signature, expected)) return null;
  const expiresDot = value.lastIndexOf(".");
  if (Number(value.slice(expiresDot + 1)) < Date.now()) return null;
  return value.slice(0, expiresDot);
}

export async function currentAccountId(): Promise<string | null> {
  const cookieStore = await cookies();
  return readSessionValue(cookieStore.get(USER_SESSION_COOKIE)?.value);
}
