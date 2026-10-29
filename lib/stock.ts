import type Stripe from "stripe";
import { updateStore } from "./store";

const REMEMBERED_SESSIONS = 300;

// Takes a paid order's items off stock, once per checkout session. Numbered
// stock goes down (and becomes "out-of-stock" at zero); made-to-order and
// out-of-stock items are left alone. Also adds to each product's sold count.
export async function applyOrderToStock(stripe: Stripe, sessionId: string): Promise<void> {
  const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
    limit: 100,
    expand: ["data.price.product"],
  });

  const sold = new Map<string, number>();
  for (const item of lineItems.data) {
    const product = item.price?.product;
    const productId =
      product && typeof product === "object" && !("deleted" in product && product.deleted)
        ? product.metadata?.productId
        : undefined;
    if (productId && item.quantity) {
      sold.set(productId, (sold.get(productId) ?? 0) + item.quantity);
    }
  }

  await updateStore((store) => {
    if (store.stockAppliedSessions.includes(sessionId)) return store;
    const soldCounts = { ...store.soldCounts };
    for (const [productId, quantity] of sold) soldCounts[productId] = (soldCounts[productId] ?? 0) + quantity;
    return {
      ...store,
      soldCounts,
      products: store.products.map((product) => {
        const quantity = sold.get(product.id);
        if (!quantity || typeof product.stock !== "number") return product;
        const left = product.stock - quantity;
        return { ...product, stock: left > 0 ? left : "out-of-stock" };
      }),
      stockAppliedSessions: [sessionId, ...store.stockAppliedSessions].slice(0, REMEMBERED_SESSIONS),
    };
  });
}
