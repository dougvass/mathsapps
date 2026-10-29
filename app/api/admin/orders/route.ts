import { NextResponse } from "next/server";
import Stripe from "stripe";
import { isAdminRequest } from "@/lib/auth";
import type { AdminOrder } from "@/lib/product-types";

function formatAddress(address: Stripe.Address | null | undefined): string {
  if (!address) return "";
  return [address.line1, address.line2, address.city, address.state, address.postal_code]
    .filter(Boolean)
    .join(", ");
}

function toOrder(session: Stripe.Checkout.Session): AdminOrder {
  const intent = typeof session.payment_intent === "object" ? session.payment_intent : null;
  const rate = session.shipping_cost?.shipping_rate;
  const shipping = session.collected_information?.shipping_details;
  return {
    id: session.id,
    paymentIntentId: intent?.id ?? (typeof session.payment_intent === "string" ? session.payment_intent : null),
    createdAt: session.created,
    customerName: session.customer_details?.name ?? "",
    email: session.customer_details?.email ?? "",
    shippingName: shipping?.name ?? "",
    address: formatAddress(shipping?.address ?? session.customer_details?.address),
    shippingMethod: rate && typeof rate === "object" ? rate.display_name ?? "" : "",
    items: (session.line_items?.data ?? []).map((item) => ({
      description: item.description ?? "",
      quantity: item.quantity ?? 1,
    })),
    totalCents: session.amount_total ?? 0,
    discountCents: session.total_details?.amount_discount ?? 0,
    postedAt: intent?.metadata?.posted_at || null,
  };
}

function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stripe = stripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe isn't set up yet (STRIPE_SECRET_KEY is missing)." }, { status: 500 });
  }

  try {
    const sessions = await stripe.checkout.sessions.list({
      status: "complete",
      limit: 30,
      expand: ["data.line_items", "data.payment_intent", "data.shipping_cost.shipping_rate"],
    });
    const orders = sessions.data
      .filter((session) => session.payment_status === "paid")
      .map(toOrder);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Couldn't load orders from Stripe.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Marks an order as posted (or not), stored on the Stripe payment.
export async function PATCH(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stripe = stripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe isn't set up yet." }, { status: 500 });
  }

  let body: { paymentIntentId?: unknown; posted?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body.paymentIntentId !== "string" || !body.paymentIntentId.startsWith("pi_")) {
    return NextResponse.json({ error: "Unknown order." }, { status: 400 });
  }

  const postedAt = body.posted ? new Date().toISOString() : "";
  try {
    await stripe.paymentIntents.update(body.paymentIntentId, { metadata: { posted_at: postedAt } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Couldn't update the order." }, { status: 500 });
  }
  return NextResponse.json({ postedAt: postedAt || null });
}
