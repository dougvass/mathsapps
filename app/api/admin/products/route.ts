import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/auth";
import { getAllProducts, saveAllProducts, type Product } from "@/lib/products";

const VALID_CATEGORIES = ["fidgets", "shapes", "custom"];

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(getAllProducts());
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let products: Product[];
  try {
    products = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

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
      !VALID_CATEGORIES.includes(product.category)
    ) {
      return NextResponse.json({ error: "Invalid product data." }, { status: 400 });
    }
  }

  saveAllProducts(products);
  return NextResponse.json({ ok: true });
}
