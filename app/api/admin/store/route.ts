import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { StoreConflictError } from "@/lib/store";
import { isSeasonSetting } from "@/lib/season";
import {
  isValidStock,
  MAX_GALLERY_PHOTOS,
  SOCIAL_NETWORKS,
  type ProductBadge,
} from "@/lib/product-types";
import {
  getAdminStore,
  saveStoreConfig,
  type Product,
  type StoreConfig,
} from "@/lib/products";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getAdminStore());
}

type StorePayload = Partial<StoreConfig> & { products?: Product[]; version?: string };

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
  const { heroImage, faqs, socialLinks } = body;

  if (!isImageUrl(heroImage)) return "Invalid homepage photo.";

  const { homeText } = body;
  if (
    !homeText ||
    ![homeText.heroHeadline, homeText.heroHighlight, homeText.heroIntro, homeText.aboutTitle, homeText.aboutText].every(
      (value) => typeof value === "string"
    ) ||
    !homeText.heroHeadline.trim() ||
    !homeText.aboutTitle.trim()
  ) {
    return "The homepage headline and About title can't be empty.";
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

  const { toyOfWeek, holiday } = body;
  if (!toyOfWeek || typeof toyOfWeek.productId !== "string" || typeof toyOfWeek.blurb !== "string") {
    return "Invalid Toy of the Week.";
  }
  if (
    !holiday ||
    typeof holiday.enabled !== "boolean" ||
    typeof holiday.message !== "string" ||
    typeof holiday.until !== "string" ||
    (holiday.until !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(holiday.until))
  ) {
    return "Invalid holiday mode settings.";
  }

  if (!isSeasonSetting(body.season)) return "Invalid season setting.";

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
      !product.category ||
      typeof product.wasPrice !== "number" ||
      !Number.isFinite(product.wasPrice) ||
      product.wasPrice < 0
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

  if (typeof body.version !== "string") {
    return NextResponse.json({ error: "Please reload the page and try again." }, { status: 400 });
  }

  let version: string;
  try {
    version = await saveStoreConfig(products, {
      categories,
      colors,
      sizeOptions,
      settings,
      banner,
      heroImage: body.heroImage as string,
      faqs: body.faqs!.map(({ question, answer }) => ({
        question: question.trim(),
        answer: answer.trim(),
      })),
      socialLinks: body.socialLinks!,
      toyOfWeek: { productId: body.toyOfWeek!.productId, blurb: body.toyOfWeek!.blurb.trim().slice(0, 200) },
      season: body.season!,
      holiday: {
        enabled: body.holiday!.enabled,
        until: body.holiday!.until,
        message: body.holiday!.message.trim().slice(0, 200),
      },
      homeText: {
        heroHeadline: body.homeText!.heroHeadline.trim(),
        heroHighlight: body.homeText!.heroHighlight.trim(),
        heroIntro: body.homeText!.heroIntro.trim(),
        aboutTitle: body.homeText!.aboutTitle.trim(),
        aboutText: body.homeText!.aboutText.trim(),
      },
    }, body.version);
  } catch (error) {
    if (error instanceof StoreConflictError) {
      return NextResponse.json({ error: error.message, conflict: true }, { status: 409 });
    }
    console.error(error);
    if (error instanceof Error && /suspend|paused|answer in time|fetch failed/i.test(error.message)) {
      return NextResponse.json(
        { error: "Can't save right now: Vercel has paused the website's storage (see the message at the top)." },
        { status: 503 }
      );
    }
    const message = error instanceof Error ? error.message : "Couldn't save changes.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, version });
}
