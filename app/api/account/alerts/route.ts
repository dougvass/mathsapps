import { NextResponse } from "next/server";
import { updateAccount } from "@/lib/accounts";
import { getActiveProducts } from "@/lib/products";
import { currentAccountId } from "@/lib/user-session";

const MAX_ALERTS = 30;

// Turns a "tell me when it's back" alert on or off.
export async function POST(request: Request) {
  const id = await currentAccountId();
  if (!id) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  let body: { productId?: unknown; on?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const products = await getActiveProducts();
  if (typeof body.productId !== "string" || !products.some((p) => p.id === body.productId)) {
    return NextResponse.json({ error: "That product isn't available." }, { status: 400 });
  }
  const productId = body.productId;
  const account = await updateAccount(id, (a) => ({
    ...a,
    stockAlerts: body.on
      ? [productId, ...a.stockAlerts.filter((p) => p !== productId)].slice(0, MAX_ALERTS)
      : a.stockAlerts.filter((p) => p !== productId),
  }));
  if (!account) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  return NextResponse.json({ stockAlerts: account.stockAlerts });
}
