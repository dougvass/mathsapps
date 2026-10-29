import { NextResponse } from "next/server";
import Stripe from "stripe";
import { applyOrderToStock } from "@/lib/stock";
import { recordOrder } from "@/lib/accounts";
import { POINTS_PER_DOLLAR } from "@/lib/rewards-rules";

// Adds the order (and its points) to the shopper's account, if they were signed in.
async function addOrderToAccount(stripe: Stripe, session: Stripe.Checkout.Session) {
  const accountId = session.metadata?.accountId;
  if (!accountId) return;
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
  // Points are for what was spent on toys (after discounts), not shipping.
  const spentCents = (session.amount_subtotal ?? 0) - (session.total_details?.amount_discount ?? 0);
  await recordOrder(accountId, {
    sessionId: session.id,
    paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? ""),
    date: new Date(session.created * 1000).toISOString(),
    totalCents: session.amount_total ?? 0,
    items: lineItems.data.map((item) => `${item.quantity ?? 1} × ${item.description ?? "Item"}`),
    pointsEarned: Math.max(0, Math.floor((spentCents / 100) * POINTS_PER_DOLLAR)),
  });
}

// Stripe calls this when a checkout is paid. Set it up in the Stripe
// dashboard (Developers → Webhooks) and put its signing secret in the
// STRIPE_WEBHOOK_SECRET environment variable.
export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Webhook isn't configured." }, { status: 500 });
  }

  const stripe = new Stripe(secretKey);
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      try {
        await applyOrderToStock(stripe, session.id);
        await addOrderToAccount(stripe, session);
      } catch (error) {
        console.error("Recording order failed:", error);
        // A failure response makes Stripe retry later (both steps are safe to repeat).
        return NextResponse.json({ error: "Couldn't record the order." }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
