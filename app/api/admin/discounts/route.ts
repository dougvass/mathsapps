import crypto from "crypto";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { isAdminRequest } from "@/lib/auth";
import type { DiscountCode } from "@/lib/product-types";

type CreatePayload = {
  kind?: "amount" | "percent";
  value?: number;
  firstOrderOnly?: boolean;
  expiresOn?: string;
  maxRedemptions?: number | null;
};

// No 0/O or 1/I, so codes are easy to read out and type.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(): string {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }
  return `HTZ-${suffix}`;
}

function couponLabel(coupon: Stripe.Coupon | null): string {
  if (!coupon) return "Discount";
  if (coupon.percent_off) return `${coupon.percent_off}% off`;
  if (coupon.amount_off) return `$${(coupon.amount_off / 100).toFixed(2)} off`;
  return coupon.name ?? "Discount";
}

function toDiscountCode(promo: Stripe.PromotionCode): DiscountCode {
  const coupon = typeof promo.promotion.coupon === "object" ? promo.promotion.coupon : null;
  return {
    id: promo.id,
    code: promo.code,
    label: couponLabel(coupon),
    active: promo.active,
    timesRedeemed: promo.times_redeemed,
    maxRedemptions: promo.max_redemptions,
    expiresAt: promo.expires_at,
    firstOrderOnly: promo.restrictions.first_time_transaction,
  };
}

function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

function errorResponse(error: unknown) {
  console.error(error);
  const message = error instanceof Error ? error.message : "Something went wrong with Stripe.";
  return NextResponse.json({ error: message }, { status: 500 });
}

function notConfigured() {
  return NextResponse.json(
    { error: "Stripe isn't set up yet (STRIPE_SECRET_KEY is missing)." },
    { status: 500 }
  );
}

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stripe = stripeClient();
  if (!stripe) return notConfigured();

  try {
    const list = await stripe.promotionCodes.list({
      limit: 100,
      expand: ["data.promotion.coupon"],
    });
    return NextResponse.json({ codes: list.data.map(toDiscountCode) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreatePayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { kind, value, firstOrderOnly, expiresOn, maxRedemptions } = body;

  if (kind !== "amount" && kind !== "percent") {
    return NextResponse.json({ error: "Choose $ off or % off." }, { status: 400 });
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return NextResponse.json({ error: "Enter a discount greater than 0." }, { status: 400 });
  }
  if (kind === "percent" && (value > 100 || !Number.isInteger(value))) {
    return NextResponse.json({ error: "Percent off must be a whole number from 1 to 100." }, { status: 400 });
  }
  if (
    maxRedemptions != null &&
    (!Number.isInteger(maxRedemptions) || maxRedemptions < 1)
  ) {
    return NextResponse.json({ error: "Usage limit must be a whole number of 1 or more." }, { status: 400 });
  }

  let expiresAt: number | undefined;
  if (expiresOn) {
    // End of the chosen day, Australian Eastern Standard Time.
    const parsed = Date.parse(`${expiresOn}T23:59:59+10:00`);
    if (Number.isNaN(parsed) || parsed <= Date.now()) {
      return NextResponse.json({ error: "The expiry date must be in the future." }, { status: 400 });
    }
    expiresAt = Math.floor(parsed / 1000);
  }

  const stripe = stripeClient();
  if (!stripe) return notConfigured();

  try {
    const amountCents = Math.round(value * 100);
    const coupon = await stripe.coupons.create(
      kind === "percent"
        ? { percent_off: value, duration: "once", name: `${value}% off` }
        : {
            amount_off: amountCents,
            currency: "aud",
            duration: "once",
            name: `$${(amountCents / 100).toFixed(2)} off`,
          }
    );

    const promo = await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: coupon.id },
      code: randomCode(),
      ...(expiresAt ? { expires_at: expiresAt } : {}),
      ...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}),
      ...(firstOrderOnly ? { restrictions: { first_time_transaction: true } } : {}),
      expand: ["promotion.coupon"],
    });

    return NextResponse.json({ code: toDiscountCode(promo) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (typeof body.id !== "string" || !body.id.startsWith("promo_")) {
    return NextResponse.json({ error: "Unknown code." }, { status: 400 });
  }

  const stripe = stripeClient();
  if (!stripe) return notConfigured();

  try {
    const promo = await stripe.promotionCodes.update(body.id, {
      active: false,
      expand: ["promotion.coupon"],
    });
    return NextResponse.json({ code: toDiscountCode(promo) });
  } catch (error) {
    return errorResponse(error);
  }
}
