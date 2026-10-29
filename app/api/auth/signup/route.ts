import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hashPassword } from "@/lib/auth";
import { createEmailAccount } from "@/lib/accounts";
import { NAME_MAX, passwordProblem, validEmail } from "@/lib/password-rules";
import { tooManyAttempts, visitorKey } from "@/lib/rate-limit";
import { withSession } from "@/lib/session-response";
import { REFERRAL_COOKIE, signInConfigured } from "@/lib/user-session";

export async function POST(request: Request) {
  if (!signInConfigured()) return NextResponse.json({ error: "Accounts aren't switched on yet." }, { status: 500 });

  let body: { email?: unknown; name?: unknown; password?: unknown; website?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Hidden field only bots fill in.
  if (body.website) return NextResponse.json({ error: "Something went wrong." }, { status: 400 });
  if (tooManyAttempts(`signup:${visitorKey(request)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many new accounts from here. Please try again later." }, { status: 429 });
  }

  const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ").slice(0, NAME_MAX) : "";
  if (!name) return NextResponse.json({ error: "Please enter your first name." }, { status: 400 });
  if (!validEmail(body.email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  const problem = passwordProblem(body.password);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const cookieStore = await cookies();
  let account;
  try {
    account = await createEmailAccount({
      email: body.email,
      name,
      passwordHash: hashPassword(body.password as string),
      referralCode: cookieStore.get(REFERRAL_COOKIE)?.value ?? "",
    });
  } catch (error) {
    console.error("Creating account failed:", error);
    return NextResponse.json({ error: "Sorry, we couldn't create your account. Please try again." }, { status: 500 });
  }
  if (!account) {
    return NextResponse.json({ error: "There's already an account with that email. Try signing in." }, { status: 409 });
  }

  const response = withSession(NextResponse.json({ ok: true }), account.id, request);
  response.cookies.delete(REFERRAL_COOKIE);
  return response;
}
