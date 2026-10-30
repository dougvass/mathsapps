import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adjustPoints, getAccount, updateAccount } from "@/lib/accounts";
import { stripeClient } from "@/lib/account-view";
import { currentAccountId } from "@/lib/user-session";
import { STANDARD_SHIPPING_AUD_CENTS } from "@/lib/site";
import { claimSpin, getSpin, releaseSpin, setSpinCode, visitorId, type SpinRecord } from "@/lib/spins";
import { WHEEL_CODE_DAYS, WHEEL_POINTS, WHEEL_PRIZES, type WheelPrizeKey } from "@/lib/wheel";

export const dynamic = "force-dynamic";

// Remembers which spin record is this browser's, even if its internet address changes.
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

// The spin this browser (or its account) already had, if any.
async function previousSpin(request: Request): Promise<{ id: string; record: SpinRecord | null }> {
  const cookieStore = await cookies();
  const id = visitorId(request);
  const cookieId = cookieStore.get(SPUN_COOKIE)?.value;
  const record = (cookieId && /^[a-f0-9]{32}$/.test(cookieId) ? await getSpin(cookieId) : null) ?? (await getSpin(id));
  return { id, record };
}

function withSpinCookie(response: NextResponse, id: string, request: Request) {
  response.cookies.set(SPUN_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
  return response;
}

// Has this visitor spun? (So a refresh shows their prize instead of a new spin.)
export async function GET(request: Request) {
  const { record } = await previousSpin(request);
  const accountId = await currentAccountId();
  const account = accountId ? await getAccount(accountId) : null;
  if (record) return NextResponse.json({ spun: true, prize: record.prize, code: record.code });
  if (account?.spunWheel) return NextResponse.json({ spun: true, prize: null, code: null });
  return NextResponse.json({ spun: false });
}

// One spin per visitor; the server decides the prize.
export async function POST(request: Request) {
  const { id, record } = await previousSpin(request);
  if (record) {
    return NextResponse.json({ error: "You've already had your spin!", prize: record.prize, code: record.code }, { status: 409 });
  }
  const accountId = await currentAccountId();
  const account = accountId ? await getAccount(accountId) : null;
  if (account?.spunWheel) {
    return NextResponse.json({ error: "You've already had your spin!", prize: null, code: null }, { status: 409 });
  }

  const prize = pickPrize(Boolean(account));
  // Claim the spin first, so double taps or two tabs can't both win.
  const existing = await claimSpin(id, { at: Date.now(), prize, code: null });
  if (existing) {
    return NextResponse.json({ error: "You've already had your spin!", prize: existing.prize, code: existing.code }, { status: 409 });
  }

  let code: string | null = null;
  try {
    if (prize === "pct5" || prize === "pct10" || prize === "ship") {
      const stripe = stripeClient();
      if (!stripe) throw new Error("Stripe isn't set up.");
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
      await setSpinCode(id, code);
    } else if (prize === "points" && account) {
      await adjustPoints(account.id, WHEEL_POINTS, "Spin the wheel prize 🎡");
    }
    if (account && prize !== "again") {
      await updateAccount(account.id, (a) => ({ ...a, spunWheel: true }));
    }
  } catch (error) {
    console.error("Spin prize failed:", error);
    // Nothing was won, so let them try again.
    await releaseSpin(id);
    return NextResponse.json({ error: "Oops, the wheel got stuck. Please try again later." }, { status: 500 });
  }

  return withSpinCookie(NextResponse.json({ prize, code }), id, request);
}
