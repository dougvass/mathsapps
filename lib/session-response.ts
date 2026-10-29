import { NextResponse } from "next/server";
import { createSessionValue, SESSION_DAYS, USER_SESSION_COOKIE } from "./user-session";

// Signs the shopper in by setting the session cookie on the response.
export function withSession<T extends NextResponse>(response: T, accountId: string, request: Request): T {
  const session = createSessionValue(accountId);
  if (session) {
    response.cookies.set(USER_SESSION_COOKIE, session, {
      httpOnly: true,
      secure: new URL(request.url).protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    });
  }
  return response;
}
