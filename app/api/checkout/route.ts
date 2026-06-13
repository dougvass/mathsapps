import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getActiveProducts } from "@/lib/products";

type CheckoutItem = {
  productId: string;
  quantity: number;
};

// Flat-rate domestic shipping. Adjust to match real postage costs.
const STANDARD_SHIPPING_AUD_CENTS = 995;

export async function POST(request: Request) {
  let body: { items?: CheckoutItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Checkout isn't configured yet. Please try again later." },
      { status: 500 }
    );
  }

  const products = getActiveProducts();
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;

    const quantity = Math.min(99, Math.max(1, Math.floor(item.quantity) || 1));

    lineItems.push({
      quantity,
      price_data: {
        currency: "aud",
        unit_amount: Math.round(product.price * 100),
        product_data: {
          name: product.name,
          description: product.description,
          ...(product.image.startsWith("http") ? { images: [product.image] } : {}),
        },
      },
    });
  }

  if (lineItems.length === 0) {
    return NextResponse.json({ error: "No valid items in your cart." }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const stripe = new Stripe(secretKey);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cancel`,
    shipping_address_collection: { allowed_countries: ["AU"] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: STANDARD_SHIPPING_AUD_CENTS, currency: "aud" },
          display_name: "Standard Shipping",
          delivery_estimate: {
            minimum: { unit: "business_day", value: 3 },
            maximum: { unit: "business_day", value: 7 },
          },
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 0, currency: "aud" },
          display_name: "Local Pickup (Free)",
          delivery_estimate: {
            minimum: { unit: "business_day", value: 1 },
            maximum: { unit: "business_day", value: 3 },
          },
        },
      },
    ],
  });

  return NextResponse.json({ url: session.url });
}
