import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adjustPoints, getAccount, updateAccount } from "@/lib/accounts";
import { stripeClient } from "@/lib/account-view";
import { tooManyAttempts, visitorKey } from "@/lib/rate-limit";
import { currentAccountId } from "@/lib/user-session";
import { STANDARD_SHIPPING_AUD_CENTS } from "@/lib/site";
import { WHEEL_CODE_DAYS, WHEEL_POINTS, WHEEL_PRIZES, type WheelPrizeKey } from "@/lib/wheel";

const SPUN_COOKIE = "htz_spun";
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function spinCode(): string {
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  return `SPIN-${suffix}`;
}

function pickPrize(signedIn: boolean): WheelPrizeKey {
  // Points need an account to go into.
  const pool = WHEEL_PRIZES.filter((p) => signedIn || p.key !== "points");
  const total = pool.reduce((sum, p) => sum + p.weight, 0);
  let roll = crypto.randomInt(total);
  for (const prize of pool) {
    if (roll < prize.weight) return prize.key;
    roll -= prize.weight;
  }
  return "pct5";
}

// One spin per visitor; the server decides the prize.
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accountId = await currentAccountId();
  const account = accountId ? await getAccount(accountId) : null;
  if (cookieStore.get(SPUN_COOKIE) || account?.spunWheel) {
    return NextResponse.json({ error: "You've already had your spin. Come back another time!" }, { status: 409 });
  }
  if (tooManyAttempts(`spin:${visitorKey(request)}`, 3, 24 * 60 * 60 * 1000)) {
    return NextResponse.json({ error: "No more spins from here today!" }, { status: 429 });
  }

  const prize = pickPrize(Boolean(account));
  let code: string | null = null;

  try {
    if (prize === "pct5" || prize === "pct10" || prize === "ship") {
      const stripe = stripeClient();
      if (!stripe) return NextResponse.json({ error: "The wheel isn't ready yet." }, { status: 500 });
      const coupon = await stripe.coupons.create(
        prize === "ship"
          ? { amount_off: STANDARD_SHIPPING_AUD_CENTS, currency: "aud", duration: "once", name: "Free shipping (spin prize)" }
          : { percent_off: prize === "pct5" ? 5 : 10, duration: "once", name: `${prize === "pct5" ? 5 : 10}% off (spin prize)` }
      );
      const promo = await stripe.promotionCodes.create({
        promotion: { type: "coupon", coupon: coupon.id },
        code: spinCode(),
        max_redemptions: 1,
        expires_at: Math.floor(Date.now() / 1000) + WHEEL_CODE_DAYS * 24 * 60 * 60,
      });
      code = promo.code;
    } else if (prize === "points" && account) {
      await adjustPoints(account.id, WHEEL_POINTS, "Spin the wheel prize 🎡");
    }
    if (account && prize !== "again") {
      await updateAccount(account.id, (a) => ({ ...a, spunWheel: true }));
    }
  } catch (error) {
    console.error("Spin prize failed:", error);
    return NextResponse.json({ error: "Oops, the wheel got stuck. Please try again." }, { status: 500 });
  }

  const response = NextResponse.json({ prize, code });
  response.cookies.set(SPUN_COOKIE, prize, {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    // "Try again tomorrow" really means tomorrow.
    maxAge: prize === "again" ? 24 * 60 * 60 : 365 * 24 * 60 * 60,
  });
  return response;
}
