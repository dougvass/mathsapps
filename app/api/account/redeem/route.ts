import crypto from "crypto";
import { NextResponse } from "next/server";
import { adjustPoints, getAccount, spendPoints, updateAccount } from "@/lib/accounts";
import { stripeClient } from "@/lib/account-view";
import { currentAccountId } from "@/lib/user-session";
import { REDEEM_POINTS, REDEEM_VALUE_CENTS } from "@/lib/rewards-rules";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function rewardCode(): string {
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  return `REWARD-${suffix}`;
}

// Turns points into a one-use discount code.
export async function POST() {
  const id = await currentAccountId();
  if (!id) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const stripe = stripeClient();
  if (!stripe) return NextResponse.json({ error: "Rewards aren't set up yet." }, { status: 500 });

  const label = `$${REDEEM_VALUE_CENTS / 100} reward code`;
  if (!(await spendPoints(id, REDEEM_POINTS, label))) {
    return NextResponse.json({ error: `You need ${REDEEM_POINTS} points for a reward.` }, { status: 400 });
  }

  try {
    const account = await getAccount(id);
    const coupon = await stripe.coupons.create({
      amount_off: REDEEM_VALUE_CENTS,
      currency: "aud",
      duration: "once",
      name: `$${REDEEM_VALUE_CENTS / 100} off (rewards)`,
    });
    const promo = await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: coupon.id },
      code: rewardCode(),
      max_redemptions: 1,
      metadata: { accountId: id, email: account?.email ?? "" },
    });
    const reward = { code: promo.code, valueCents: REDEEM_VALUE_CENTS, createdAt: new Date().toISOString() };
    await updateAccount(id, (a) => ({ ...a, rewardCodes: [reward, ...a.rewardCodes].slice(0, 30) }));
    return NextResponse.json({ code: promo.code });
  } catch (error) {
    console.error("Creating reward code failed:", error);
    await adjustPoints(id, REDEEM_POINTS, "Refund – reward code couldn't be made");
    return NextResponse.json({ error: "Sorry, we couldn't make your code. Your points are back." }, { status: 500 });
  }
}
