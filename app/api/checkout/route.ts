import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getActiveProducts } from "@/lib/products";
import {
  cleanCustomText,
  FILE_PRINT_ID,
  MAX_CUSTOM_TEXT_LENGTH,
  MYSTERY_BAG_ID,
  stockLimit,
} from "@/lib/product-types";
import { bundleApplies, bundledUnitCents, GIFT_MESSAGE_MAX, GIFT_WRAP_CENTS } from "@/lib/deals";
import { getPrintFile, type PrintFile } from "@/lib/print-files";
import { validMysteryWishes } from "@/lib/mystery-bag";
import { discountCents, lookupDiscount, normaliseCode } from "@/lib/discount-lookup";
import { getAccount } from "@/lib/accounts";
import { ensureStripeCustomer } from "@/lib/account-view";
import { currentAccountId } from "@/lib/user-session";
import {
  absoluteUrl,
  FREE_SHIPPING_THRESHOLD_AUD_CENTS,
  STANDARD_SHIPPING_AUD_CENTS,
} from "@/lib/site";

type CheckoutItem = {
  productId: string;
  color?: string;
  size?: string;
  customText?: string;
  extra?: string;
  quantity: number;
};

export async function POST(request: Request) {
  let body: { items?: CheckoutItem[]; discountCode?: string; gift?: { wrap?: unknown; message?: unknown } };
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

  const products = await getActiveProducts();
  type Line = {
    productId: string;
    quantity: number;
    unitCents: number;
    name: string;
    description: string;
    image: string;
    metadata: Record<string, string>;
  };
  const lines: Line[] = [];
  const printFiles: PrintFile[] = [];
  const quantityByProduct = new Map<string, number>();

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;

    const quantity = Math.min(99, Math.max(1, Math.floor(item.quantity) || 1));

    const ordered = (quantityByProduct.get(product.id) ?? 0) + quantity;
    quantityByProduct.set(product.id, ordered);
    if (ordered > stockLimit(product.stock)) {
      const error =
        product.stock === "out-of-stock"
          ? `Sorry, ${product.name} is now out of stock. Please remove it from your cart.`
          : `Sorry, there are only ${product.stock} of ${product.name} left. Please reduce the quantity in your cart.`;
      return NextResponse.json({ error }, { status: 400 });
    }

    const customText = product.needsCustomText ? cleanCustomText(item.customText) : "";
    if (product.needsCustomText && !customText) {
      return NextResponse.json(
        { error: `Please add the name or text to print for ${product.name}.` },
        { status: 400 }
      );
    }
    if (customText.length > MAX_CUSTOM_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `The text for ${product.name} must be ${MAX_CUSTOM_TEXT_LENGTH} characters or fewer.` },
        { status: 400 }
      );
    }

    // The price of a customer's own file comes from our scan of it, never from the browser.
    let unitCents = Math.round(product.price * 100);
    let extra = "";
    if (product.id === FILE_PRINT_ID) {
      const file = item.extra ? await getPrintFile(item.extra) : null;
      if (!file) {
        return NextResponse.json({ error: "We couldn't find your uploaded file. Please upload it again." }, { status: 400 });
      }
      unitCents = file.priceCents;
      extra = `File: ${file.name}`;
      if (!printFiles.some((f) => f.id === file.id)) printFiles.push(file);
    } else if (product.id === MYSTERY_BAG_ID) {
      if (!validMysteryWishes(item.extra)) {
        return NextResponse.json({ error: "Please choose what you like for your mystery bag again." }, { status: 400 });
      }
      extra = item.extra;
    }

    const variant = [
      product.chooseColor ? item.color : undefined,
      item.size,
      customText ? `Text: "${customText}"` : undefined,
      extra || undefined,
    ].filter((value): value is string => Boolean(value));
    lines.push({
      productId: product.id,
      quantity,
      unitCents,
      name: variant.length > 0 ? `${product.name} (${variant.join(", ")})` : product.name,
      description: product.description,
      image: product.image,
      // Read by the Stripe webhook (stock) and the admin order list.
      metadata: {
        productId: product.id,
        color: product.chooseColor ? (item.color ?? "") : "",
        size: item.size ?? "",
        customText,
        extra,
      },
    });
  }

  // Buy enough toys and they're all a bit cheaper.
  const bundle = bundleApplies(lines);
  let subtotalCents = 0;
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = lines.map((line) => {
    const unitAmount = bundledUnitCents(line, bundle);
    subtotalCents += unitAmount * line.quantity;
    return {
      quantity: line.quantity,
      price_data: {
        currency: "aud",
        unit_amount: unitAmount,
        product_data: {
          name: bundle && unitAmount !== line.unitCents ? `${line.name} – bundle deal` : line.name,
          ...(line.description ? { description: line.description } : {}),
          metadata: line.metadata,
          ...(line.image ? { images: [absoluteUrl(line.image)] } : {}),
        },
      },
    };
  });

  if (lineItems.length === 0) {
    return NextResponse.json({ error: "No valid items in your cart." }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const stripe = new Stripe(secretKey);

  // A code typed in the cart is applied here; otherwise Stripe's payment page
  // offers its own "Add promotion code" box (Stripe allows one or the other).
  let promotionCodeId: string | null = null;
  let itemsAfterDiscount = subtotalCents;
  const discountCode = normaliseCode(body.discountCode);
  if (discountCode) {
    const result = await lookupDiscount(stripe, discountCode);
    if (!result.ok) return NextResponse.json({ error: result.error, discountError: true }, { status: 400 });
    if (result.discount.minimumCents && subtotalCents < result.discount.minimumCents) {
      return NextResponse.json(
        {
          error: `That code needs an order of at least $${(result.discount.minimumCents / 100).toFixed(2)}.`,
          discountError: true,
        },
        { status: 400 }
      );
    }
    promotionCodeId = result.promotionCodeId;
    itemsAfterDiscount = subtotalCents - discountCents(result.discount, subtotalCents);
  }
  const freeShipping = itemsAfterDiscount >= FREE_SHIPPING_THRESHOLD_AUD_CENTS;

  const giftWrap = body.gift?.wrap === true;
  const giftMessage = typeof body.gift?.message === "string" ? body.gift.message.trim().slice(0, GIFT_MESSAGE_MAX) : "";
  if (giftWrap) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "aud",
        unit_amount: GIFT_WRAP_CENTS,
        product_data: { name: "Gift wrap 🎁", metadata: { productId: "gift-wrap" } },
      },
    });
  }

  // Signed-in shoppers earn points (via the webhook) and get their saved address filled in.
  const accountId = await currentAccountId();
  const account = accountId ? await getAccount(accountId) : null;
  let customerId: string | null = null;
  if (account) {
    try {
      customerId = await ensureStripeCustomer(stripe, account);
    } catch (error) {
      console.error("Couldn't set up the Stripe customer:", error);
    }
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      metadata: {
        ...(account ? { accountId: account.id } : {}),
        ...(giftWrap ? { giftWrap: "yes", giftMessage } : {}),
        // Uploaded files for the admin to download (Stripe metadata values max 500 characters).
        ...(printFiles.length > 0
          ? { printFiles: printFiles.map((f) => `${f.id}:${f.name}`).join("|").slice(0, 500) }
          : {}),
      },
      ...(customerId
        ? { customer: customerId, customer_update: { shipping: "auto" as const, name: "auto" as const } }
        : {}),
      ...(promotionCodeId
        ? { discounts: [{ promotion_code: promotionCodeId }] }
        : { allow_promotion_codes: true }),
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
      shipping_address_collection: { allowed_countries: ["AU"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: freeShipping ? 0 : STANDARD_SHIPPING_AUD_CENTS, currency: "aud" },
            display_name: freeShipping ? "Free Standard Shipping" : "Standard Shipping",
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
  } catch (error) {
    // e.g. a first-order-only code used by a returning customer.
    if (promotionCodeId && error instanceof Stripe.errors.StripeInvalidRequestError) {
      return NextResponse.json(
        { error: "That discount code can't be used on this order.", discountError: true },
        { status: 400 }
      );
    }
    throw error;
  }

  return NextResponse.json({ url: session.url });
}
