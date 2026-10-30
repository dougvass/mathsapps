import crypto from "crypto";
import type Stripe from "stripe";
import { GIFT_CARD_ID } from "./product-types";

export const GIFT_CARD_AMOUNTS = [10, 20, 50];

export function giftCardAmount(value: unknown): number | null {
  const amount = Number(value);
  return GIFT_CARD_AMOUNTS.includes(amount) ? amount : null;
}

export type IssuedGiftCard = { code: string; valueCents: number };

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// The same order always gets the same codes, so creating them twice (thank-you
// page and webhook at the same moment) can't make extra cards.
function codeFor(sessionId: string, index: number): string {
  const bytes = crypto.createHash("sha256").update(`htz-gift:${sessionId}:${index}`).digest();
  let code = "";
  for (let i = 0; i < 8; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return `GIFT-${code}`;
}

function parse(saved: string | undefined): IssuedGiftCard[] {
  if (!saved) return [];
  return saved.split(",").map((entry) => {
    const [code, cents] = entry.split(":");
    return { code, valueCents: Number(cents) };
  });
}

// Makes one-use discount codes for the gift cards in a paid order (once only).
export async function issueGiftCards(stripe: Stripe, sessionId: string): Promise<IssuedGiftCard[]> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["payment_intent"] });
  if (session.payment_status !== "paid") return [];
  const intent = typeof session.payment_intent === "object" ? session.payment_intent : null;
  const saved = parse(intent?.metadata?.gift_codes);
  if (saved.length > 0) return saved;

  const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100, expand: ["data.price.product"] });
  const amounts: number[] = [];
  for (const item of lineItems.data) {
    const product = item.price?.product;
    if (!product || typeof product !== "object" || ("deleted" in product && product.deleted)) continue;
    if (product.metadata?.productId !== GIFT_CARD_ID) continue;
    const amount = giftCardAmount(product.metadata?.giftAmount);
    if (amount) for (let i = 0; i < (item.quantity ?? 1); i++) amounts.push(amount);
  }
  if (amounts.length === 0) return [];

  const cards: IssuedGiftCard[] = [];
  for (const [index, amount] of amounts.entries()) {
    const coupon = await stripe.coupons.create(
      { amount_off: amount * 100, currency: "aud", duration: "once", name: `$${amount} gift card` },
      { idempotencyKey: `gift-coupon-${sessionId}-${index}` }
    );
    const promo = await stripe.promotionCodes.create(
      { promotion: { type: "coupon", coupon: coupon.id }, code: codeFor(sessionId, index), max_redemptions: 1 },
      { idempotencyKey: `gift-code-${sessionId}-${index}` }
    );
    cards.push({ code: promo.code, valueCents: amount * 100 });
  }
  if (intent) {
    await stripe.paymentIntents.update(intent.id, {
      metadata: { gift_codes: cards.map((c) => `${c.code}:${c.valueCents}`).join(",").slice(0, 500) },
    });
  }
  return cards;
}
