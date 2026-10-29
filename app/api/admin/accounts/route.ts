import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { adjustPoints, listAccounts } from "@/lib/accounts";

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
    })),
  });
}

// Add or take away points by hand (e.g. a thank-you, or fixing a mistake).
export async function PATCH(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { id?: string; points?: number; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
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
