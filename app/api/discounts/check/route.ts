import { NextResponse } from "next/server";
import Stripe from "stripe";
import { lookupDiscount } from "@/lib/discount-lookup";

const MAX_CHECKS = 20;
const WINDOW_MS = 10 * 60 * 1000;
// Best-effort limit on code guessing (resets when the server instance restarts).
const checksByVisitor = new Map<string, number[]>();

export async function POST(request: Request) {
  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const now = Date.now();
  const recent = (checksByVisitor.get(visitor) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_CHECKS) {
    return NextResponse.json({ error: "Too many tries – please wait a few minutes." }, { status: 429 });
  }
  checksByVisitor.set(visitor, [...recent, now]);

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Discount codes aren't available right now." }, { status: 500 });
  }

  let code: unknown;
  try {
    code = (await request.json()).code;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const result = await lookupDiscount(new Stripe(secretKey), String(code ?? ""));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ discount: result.discount });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Couldn't check that code. Please try again." }, { status: 500 });
  }
}
