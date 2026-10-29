import crypto from "crypto";
import { NextResponse } from "next/server";
import { googleConfigured, OAUTH_STATE_COOKIE, safeNext } from "@/lib/user-session";

// Starts "Continue with Google".
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!googleConfigured()) return NextResponse.redirect(new URL("/account?error=setup", url));

  const state = crypto.randomBytes(24).toString("base64url");
  const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  google.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  google.searchParams.set("redirect_uri", `${url.origin}/api/auth/google/callback`);
  google.searchParams.set("response_type", "code");
  google.searchParams.set("scope", "openid email profile");
  google.searchParams.set("state", state);
  google.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(google);
  response.cookies.set(OAUTH_STATE_COOKIE, JSON.stringify({ state, next: safeNext(url.searchParams.get("next")) }), {
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
