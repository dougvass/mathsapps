import { NextResponse } from "next/server";
import Stripe from "stripe";
import { applyOrderToStock } from "@/lib/stock";

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
      } catch (error) {
        console.error("Updating stock for order failed:", error);
        // A failure response makes Stripe retry later.
        return NextResponse.json({ error: "Couldn't update stock." }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
