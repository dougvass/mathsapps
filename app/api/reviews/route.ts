import crypto from "crypto";
import { NextResponse } from "next/server";
import {
  cleanCustomText,
  REVIEW_NAME_MAX,
  REVIEW_TEXT_MAX,
  REVIEW_TEXT_MIN,
  type Review,
} from "@/lib/product-types";
import { getActiveProducts } from "@/lib/products";
import { updateReviews } from "@/lib/reviews";
import { claimReviewPoints } from "@/lib/accounts";
import { currentAccountId } from "@/lib/user-session";

// Real people take a few seconds to fill in the form; bots usually don't.
const MIN_FILL_MS = 3000;
const MAX_PER_WINDOW = 3;
const WINDOW_MS = 10 * 60 * 1000;
const LINK_PATTERN = /(https?:\/\/|www\.|\.(com|net|org|ru|xyz|io)\b)/i;

// Best-effort per-visitor limit (resets when the server instance restarts).
const recentByVisitor = new Map<string, number[]>();

function tooManyRecent(visitor: string): boolean {
  const now = Date.now();
  const recent = (recentByVisitor.get(visitor) ?? []).filter((time) => now - time < WINDOW_MS);
  recentByVisitor.set(visitor, recent);
  return recent.length >= MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  let body: {
    name?: unknown;
    text?: unknown;
    rating?: unknown;
    website?: unknown;
    startedAt?: unknown;
    productId?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // "website" is a hidden field only bots fill in. Pretend it worked.
  if (body.website) return NextResponse.json({ ok: true });
  if (typeof body.startedAt !== "number" || Date.now() - body.startedAt < MIN_FILL_MS) {
    return NextResponse.json({ error: "Please take a moment to write your review." }, { status: 400 });
  }

  const name = cleanCustomText(body.name);
  const text = cleanCustomText(body.text);
  const rating = body.rating;

  if (!name || name.length > REVIEW_NAME_MAX) {
    return NextResponse.json({ error: `Please add your name (up to ${REVIEW_NAME_MAX} characters).` }, { status: 400 });
  }
  if (text.length < REVIEW_TEXT_MIN || text.length > REVIEW_TEXT_MAX) {
    return NextResponse.json(
      { error: `Reviews need to be ${REVIEW_TEXT_MIN}–${REVIEW_TEXT_MAX} characters.` },
      { status: 400 }
    );
  }
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Please choose 1 to 5 stars." }, { status: 400 });
  }
  if (LINK_PATTERN.test(name) || LINK_PATTERN.test(text)) {
    return NextResponse.json({ error: "Links aren't allowed in reviews." }, { status: 400 });
  }

  let productId = "";
  if (body.productId) {
    const products = await getActiveProducts();
    const product = products.find((p) => p.id === body.productId);
    if (!product) {
      return NextResponse.json({ error: "That product isn't available." }, { status: 400 });
    }
    productId = product.id;
  }

  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (tooManyRecent(visitor)) {
    return NextResponse.json(
      { error: "Thanks! You've posted a few reviews already – please try again later." },
      { status: 429 }
    );
  }

  const review: Review = {
    id: `review-${crypto.randomUUID()}`,
    name,
    text,
    rating,
    createdAt: new Date().toISOString(),
    productId,
  };

  try {
    await updateReviews((reviews) => [review, ...reviews]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Sorry, we couldn't post your review. Please try again." }, { status: 500 });
  }

  recentByVisitor.get(visitor)?.push(Date.now());

  const accountId = await currentAccountId();
  if (accountId) {
    try {
      await claimReviewPoints(accountId);
    } catch (error) {
      console.error("Review points failed:", error);
    }
  }
  return NextResponse.json({ review });
}
