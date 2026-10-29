import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signInAccount } from "@/lib/accounts";
import {
  createSessionValue,
  OAUTH_STATE_COOKIE,
  REFERRAL_COOKIE,
  safeNext,
  SESSION_DAYS,
  USER_SESSION_COOKIE,
} from "@/lib/user-session";

type IdToken = { sub: string; email?: string; email_verified?: boolean; name?: string; picture?: string; aud: string; iss: string };

// Google sends the shopper back here after they choose their account.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const cookieStore = await cookies();
  const fail = (reason: string) => {
    const response = NextResponse.redirect(new URL(`/account?error=${reason}`, url));
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  };

  let saved: { state?: string; next?: string } = {};
  try {
    saved = JSON.parse(cookieStore.get(OAUTH_STATE_COOKIE)?.value ?? "{}");
  } catch {}
  const code = url.searchParams.get("code");
  if (!code || !saved.state || saved.state !== url.searchParams.get("state")) return fail("signin");

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: `${url.origin}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  const tokens = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || typeof tokens.id_token !== "string") return fail("signin");

  // The ID token came straight from Google over HTTPS, so its contents can be
  // trusted without checking the signature; we still check who it's for.
  let profile: IdToken;
  try {
    profile = JSON.parse(Buffer.from(tokens.id_token.split(".")[1], "base64url").toString());
  } catch {
    return fail("signin");
  }
  const validIssuer = profile.iss === "https://accounts.google.com" || profile.iss === "accounts.google.com";
  if (profile.aud !== process.env.GOOGLE_CLIENT_ID || !validIssuer || !profile.sub || !profile.email || !profile.email_verified) {
    return fail("signin");
  }

  let accountId: string;
  try {
    const account = await signInAccount({
      id: `google-${profile.sub}`,
      email: profile.email,
      name: profile.name ?? profile.email.split("@")[0],
      picture: profile.picture ?? "",
      referralCode: cookieStore.get(REFERRAL_COOKIE)?.value ?? "",
    });
    accountId = account.id;
  } catch (error) {
    console.error("Saving account failed:", error);
    return fail("save");
  }

  const session = createSessionValue(accountId);
  if (!session) return fail("setup");
  const response = NextResponse.redirect(new URL(safeNext(saved.next ?? null), url));
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(REFERRAL_COOKIE);
  response.cookies.set(USER_SESSION_COOKIE, session, {
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return response;
}
