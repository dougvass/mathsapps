import { NextResponse } from "next/server";
import { stripeClient } from "@/lib/account-view";
import { matchesOrderNumber, orderNumber } from "@/lib/order-number";
import { validEmail } from "@/lib/password-rules";
import { tooManyAttempts, visitorKey } from "@/lib/rate-limit";

// Looks up one order by its email and order number (both needed, so nobody
// can see someone else's order with just an email).
export async function POST(request: Request) {
  if (tooManyAttempts(`track:${visitorKey(request)}`, 15, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many tries. Please wait a few minutes." }, { status: 429 });
  }
  let body: { email?: unknown; order?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!validEmail(body.email) || typeof body.order !== "string") {
    return NextResponse.json({ error: "Please enter your email and order number." }, { status: 400 });
  }
  const stripe = stripeClient();
  if (!stripe) return NextResponse.json({ error: "Order tracking isn't ready yet." }, { status: 500 });

  const notFound = NextResponse.json(
    { error: "We couldn't find that order. Check the email and order number (it looks like HTZ-AB12CD34)." },
    { status: 404 }
  );
  try {
    const sessions = await stripe.checkout.sessions.list({
      customer_details: { email: body.email.trim().toLowerCase() },
      limit: 50,
      expand: ["data.line_items", "data.payment_intent"],
    });
    const session = sessions.data.find((s) => matchesOrderNumber(s.id, body.order as string) && s.payment_status === "paid");
    if (!session) return notFound;
    const intent = typeof session.payment_intent === "object" ? session.payment_intent : null;
    return NextResponse.json({
      order: {
        number: orderNumber(session.id),
        date: new Date(session.created * 1000).toISOString(),
        items: (session.line_items?.data ?? []).map((item) => `${item.quantity ?? 1} × ${item.description ?? "Item"}`),
        totalCents: session.amount_total ?? 0,
        postedAt: intent?.metadata?.posted_at || null,
      },
    });
  } catch (error) {
    console.error("Order lookup failed:", error);
    return notFound;
  }
}
