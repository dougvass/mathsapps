import { NextResponse } from "next/server";
import { verifyPasswordHash } from "@/lib/auth";
import { emailAccountId, getAccount, normaliseEmail } from "@/lib/accounts";
import { validEmail } from "@/lib/password-rules";
import { tooManyAttempts, visitorKey } from "@/lib/rate-limit";
import { withSession } from "@/lib/session-response";
import { signInConfigured } from "@/lib/user-session";

const WRONG = "That email and password don't match.";

export async function POST(request: Request) {
  if (!signInConfigured()) return NextResponse.json({ error: "Accounts aren't switched on yet." }, { status: 500 });

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!validEmail(body.email) || typeof body.password !== "string") {
    return NextResponse.json({ error: WRONG }, { status: 400 });
  }

  const email = normaliseEmail(body.email);
  if (
    tooManyAttempts(`login-ip:${visitorKey(request)}`, 20, 15 * 60 * 1000) ||
    tooManyAttempts(`login-email:${email}`, 8, 15 * 60 * 1000)
  ) {
    return NextResponse.json({ error: "Too many tries. Please wait 15 minutes and try again." }, { status: 429 });
  }

  const account = await getAccount(emailAccountId(email));
  if (!account?.passwordHash || !verifyPasswordHash(body.password, account.passwordHash)) {
    return NextResponse.json({ error: WRONG }, { status: 401 });
  }
  return withSession(NextResponse.json({ ok: true }), account.id, request);
}
