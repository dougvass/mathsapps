import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/auth";
import {
  getAllProducts,
  getStoreConfig,
  saveStoreConfig,
  type CategoryDef,
  type Product,
  type SizeOption,
  type StoreSettings,
} from "@/lib/products";

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [products, config] = await Promise.all([getAllProducts(), getStoreConfig()]);
  return NextResponse.json({ products, ...config });
}

type StorePayload = {
  products?: Product[];
  categories?: CategoryDef[];
  colors?: string[];
  sizeOptions?: SizeOption[];
  settings?: StoreSettings;
};

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: StorePayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { products, categories, colors, sizeOptions, settings } = body;

  if (!Array.isArray(products)) {
    return NextResponse.json({ error: "Expected an array of products." }, { status: 400 });
  }
  for (const product of products) {
    if (
      typeof product.id !== "string" ||
      typeof product.name !== "string" ||
      typeof product.description !== "string" ||
      typeof product.emoji !== "string" ||
      typeof product.image !== "string" ||
      typeof product.price !== "number" ||
      !Number.isFinite(product.price) ||
      product.price < 0 ||
      typeof product.active !== "boolean" ||
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

  await saveStoreConfig(products, { categories, colors, sizeOptions, settings });
  return NextResponse.json({ ok: true });
}
