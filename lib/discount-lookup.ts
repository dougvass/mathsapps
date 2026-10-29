import type Stripe from "stripe";

export type AppliedDiscount = {
  code: string;
  label: string;
  percentOff: number | null;
  amountOffCents: number | null;
  minimumCents: number | null;
  firstOrderOnly: boolean;
};

export type DiscountLookup =
  | { ok: true; promotionCodeId: string; discount: AppliedDiscount }
  | { ok: false; error: string };

export function normaliseCode(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase().slice(0, 40) : "";
}

// Finds an active Stripe promotion code that can still be used.
export async function lookupDiscount(stripe: Stripe, rawCode: string): Promise<DiscountLookup> {
  const code = normaliseCode(rawCode);
  if (!code) return { ok: false, error: "Enter a discount code." };

  const list = await stripe.promotionCodes.list({
    code,
    active: true,
    limit: 1,
    expand: ["data.promotion.coupon"],
  });
  const promo = list.data[0];
  const coupon = promo && typeof promo.promotion.coupon === "object" ? promo.promotion.coupon : null;
  if (!promo || !coupon || !coupon.valid) {
    return { ok: false, error: "That discount code isn't valid." };
  }
  if (promo.expires_at && promo.expires_at * 1000 < Date.now()) {
    return { ok: false, error: "That discount code has expired." };
  }
  if (promo.max_redemptions !== null && promo.times_redeemed >= promo.max_redemptions) {
    return { ok: false, error: "That discount code has been used up." };
  }

  const amountOffCents = coupon.amount_off && coupon.currency === "aud" ? coupon.amount_off : null;
  const minimumCents =
    promo.restrictions.minimum_amount && promo.restrictions.minimum_amount_currency === "aud"
      ? promo.restrictions.minimum_amount
      : null;
  const label = coupon.percent_off
    ? `${coupon.percent_off}% off`
    : amountOffCents
      ? `$${(amountOffCents / 100).toFixed(2)} off`
      : coupon.name ?? "Discount";

  return {
    ok: true,
    promotionCodeId: promo.id,
    discount: {
      code: promo.code,
      label,
      percentOff: coupon.percent_off,
      amountOffCents,
      minimumCents,
      firstOrderOnly: promo.restrictions.first_time_transaction,
    },
  };
}

// Estimated discount on an items subtotal (both in cents).
export function discountCents(discount: AppliedDiscount, subtotalCents: number): number {
  if (discount.percentOff) return Math.round((subtotalCents * discount.percentOff) / 100);
  if (discount.amountOffCents) return Math.min(discount.amountOffCents, subtotalCents);
  return 0;
}
