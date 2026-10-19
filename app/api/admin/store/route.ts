import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import {
  isValidStock,
  MAX_GALLERY_PHOTOS,
  SOCIAL_NETWORKS,
  type ProductBadge,
} from "@/lib/product-types";
import {
  getAllProducts,
  getStoreConfig,
  saveStoreConfig,
  type Product,
  type StoreConfig,
} from "@/lib/products";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [products, config] = await Promise.all([getAllProducts(), getStoreConfig()]);
  return NextResponse.json({ products, ...config });
}

type StorePayload = Partial<StoreConfig> & { products?: Product[] };

function isImageUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (value === "" || value.startsWith("/api/images/") || value.startsWith("https://"))
  );
}

function isHttpsUrlOrEmpty(value: unknown): value is string {
  if (value === "") return true;
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const BADGES: ProductBadge[] = ["", "new", "bestseller"];
// Product ids appear in page addresses (/products/<id>).
const PRODUCT_ID_PATTERN = /^[A-Za-z0-9-]+$/;

function validateExtras(body: StorePayload): string | null {
  const { heroImage, reviews, faqs, socialLinks } = body;

  if (!isImageUrl(heroImage)) return "Invalid homepage photo.";

  if (!Array.isArray(reviews)) return "Invalid reviews.";
  for (const review of reviews) {
    if (
      typeof review.id !== "string" ||
      typeof review.name !== "string" ||
      !review.name.trim() ||
      review.name.length > 60 ||
      typeof review.text !== "string" ||
      !review.text.trim() ||
      review.text.length > 600 ||
      !Number.isInteger(review.rating) ||
      review.rating < 1 ||
      review.rating > 5
    ) {
      return "Each review needs a name, some text (under 600 characters) and 1–5 stars.";
    }
  }

  if (!Array.isArray(faqs)) return "Invalid FAQ.";
  for (const faq of faqs) {
    if (
      typeof faq.question !== "string" ||
      !faq.question.trim() ||
      typeof faq.answer !== "string" ||
      !faq.answer.trim()
    ) {
      return "Each FAQ needs a question and an answer.";
    }
  }

  if (!socialLinks || typeof socialLinks !== "object") return "Invalid social links.";
  for (const network of SOCIAL_NETWORKS) {
    if (!isHttpsUrlOrEmpty(socialLinks[network])) {
      return `The ${network} link must be a full web address starting with https://`;
    }
  }

  return null;
}

export async function PUT(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: StorePayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { products, categories, colors, sizeOptions, settings, banner } = body;

  const extrasError = validateExtras(body);
  if (extrasError) {
    return NextResponse.json({ error: extrasError }, { status: 400 });
  }

  if (
    !banner ||
    typeof banner.enabled !== "boolean" ||
    !isImageUrl(banner.image) ||
    typeof banner.headline !== "string" ||
    typeof banner.subtext !== "string"
  ) {
    return NextResponse.json({ error: "Invalid banner settings." }, { status: 400 });
  }

  if (!Array.isArray(products)) {
    return NextResponse.json({ error: "Expected an array of products." }, { status: 400 });
  }
  for (const product of products) {
    if (
      typeof product.id !== "string" ||
      !PRODUCT_ID_PATTERN.test(product.id) ||
      typeof product.name !== "string" ||
      typeof product.description !== "string" ||
      typeof product.emoji !== "string" ||
      !isImageUrl(product.image) ||
      !Array.isArray(product.gallery) ||
      product.gallery.length > MAX_GALLERY_PHOTOS ||
      !product.gallery.every((photo) => photo !== "" && isImageUrl(photo)) ||
      !BADGES.includes(product.badge) ||
      typeof product.needsCustomText !== "boolean" ||
      typeof product.price !== "number" ||
      !Number.isFinite(product.price) ||
      product.price < 0 ||
      typeof product.active !== "boolean" ||
      typeof product.chooseColor !== "boolean" ||
      !isValidStock(product.stock) ||
      typeof product.category !== "string" ||
      !product.category
    ) {
      return NextResponse.json({ error: "Invalid product data." }, { status: 400 });
    }
  }

  if (!Array.isArray(categories) || categories.length === 0) {
    return NextResponse.json({ error: "You need at least one category." }, { status: 400 });
  }
  for (const category of categories) {
    if (
      typeof category.value !== "string" ||
      !category.value ||
      typeof category.label !== "string" ||
      !category.label
    ) {
      return NextResponse.json({ error: "Invalid category data." }, { status: 400 });
    }
  }

  if (!Array.isArray(colors) || colors.some((color) => typeof color !== "string" || !color)) {
    return NextResponse.json({ error: "Invalid colour list." }, { status: 400 });
  }

  if (!settings || typeof settings.printerMaxBuildMm !== "number" || !Number.isFinite(settings.printerMaxBuildMm) || settings.printerMaxBuildMm <= 0) {
    return NextResponse.json({ error: "Invalid printer max build size." }, { status: 400 });
  }

  if (!Array.isArray(sizeOptions) || sizeOptions.length === 0) {
    return NextResponse.json({ error: "You need at least one size option." }, { status: 400 });
  }
  for (const size of sizeOptions) {
    if (
      typeof size.label !== "string" ||
      !size.label ||
      typeof size.maxDimensionMm !== "number" ||
      !Number.isFinite(size.maxDimensionMm) ||
      size.maxDimensionMm <= 0
    ) {
      return NextResponse.json({ error: "Invalid size option data." }, { status: 400 });
    }
    if (size.maxDimensionMm > settings.printerMaxBuildMm) {
      return NextResponse.json(
        { error: `Size "${size.label}" exceeds the printer's max build size.` },
        { status: 400 }
      );
    }
  }

  try {
    await saveStoreConfig(products, {
      categories,
      colors,
      sizeOptions,
      settings,
      banner,
      heroImage: body.heroImage as string,
      reviews: body.reviews!.map(({ id, name, text, rating }) => ({
        id,
        name: name.trim(),
        text: text.trim(),
        rating,
      })),
      faqs: body.faqs!.map(({ question, answer }) => ({
        question: question.trim(),
        answer: answer.trim(),
      })),
      socialLinks: body.socialLinks!,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Couldn't save changes.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
