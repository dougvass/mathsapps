import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import crypto from "crypto";
import { adjustPoints, listAccounts, setPasswordHash } from "@/lib/accounts";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const accounts = await listAccounts();
  return NextResponse.json({
    members: accounts.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      points: a.points,
      orders: a.orders.length,
      createdAt: a.createdAt,
      hasPassword: Boolean(a.passwordHash),
    })),
  });
}

// Add or take away points by hand (e.g. a thank-you, or fixing a mistake).
export async function PATCH(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { id?: string; points?: number; reason?: string; resetPassword?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Forgotten password: make a temporary one for the admin to pass on.
  if (body.resetPassword) {
    if (!body.id?.startsWith("email-")) {
      return NextResponse.json({ error: "Only email accounts have passwords." }, { status: 400 });
    }
    const temporary = `htz-${crypto.randomBytes(5).toString("hex")}`;
    const account = await setPasswordHash(body.id, hashPassword(temporary));
    if (!account) return NextResponse.json({ error: "Member not found." }, { status: 404 });
    return NextResponse.json({ temporaryPassword: temporary });
  }
  const points = Math.trunc(Number(body.points));
  if (!body.id || !points || Math.abs(points) > 10000) {
    return NextResponse.json({ error: "Enter a number of points." }, { status: 400 });
  }
  const reason = (body.reason ?? "").trim().slice(0, 80) || (points > 0 ? "Bonus from HugosToyz" : "Points adjusted");
  const account = await adjustPoints(body.id, points, reason);
  if (!account) return NextResponse.json({ error: "Member not found." }, { status: 404 });
  return NextResponse.json({ points: account.points });
}
