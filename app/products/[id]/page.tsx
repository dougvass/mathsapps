import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveProducts, getStoreConfig } from "@/lib/products";
import { productPhotos } from "@/lib/product-types";
import { absoluteUrl, CHANGE_OF_MIND_RETURN_DAYS, FREE_SHIPPING_THRESHOLD_AUD_CENTS, NON_RETURNABLE_CATEGORY, productPath, SITE_NAME } from "@/lib/site";
import { jsonLdScript, productJsonLd } from "@/lib/structured-data";
import ShopShell from "@/components/ShopShell";
import ProductGallery from "@/components/ProductGallery";
import AddToCartForm from "@/components/AddToCartForm";
import StockBadge from "@/components/StockBadge";
import ProductBadgeTag from "@/components/ProductBadgeTag";
import ProductCard from "@/components/ProductCard";

// Always read the latest store data so admin edits show up without a redeploy.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

// Shared by generateMetadata and the page so the store is read once per request.
const loadPage = cache(async (id: string) => {
  const [products, config] = await Promise.all([getActiveProducts(), getStoreConfig()]);
  const product = products.find((p) => p.id === id);
  return { products, config, product };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { product } = await loadPage(id);
  if (!product) return { title: `Not found | ${SITE_NAME}` };

  const title = `${product.name} | 3D Printed | ${SITE_NAME}`;
  const description =
    product.description ||
    `${product.name} – 3D printed and finished by hand in Australia by ${SITE_NAME}.`;
  const photo = productPhotos(product)[0];

  return {
    title,
    description,
    alternates: { canonical: productPath(product.id) },
    openGraph: {
      type: "website",
      url: productPath(product.id),
      siteName: SITE_NAME,
      title,
      description,
      locale: "en_AU",
      ...(photo ? { images: [{ url: absoluteUrl(photo), alt: product.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(photo ? { images: [absoluteUrl(photo)] } : {}),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const { products, config, product } = await loadPage(id);
  if (!product) notFound();

  const category = config.categories.find((c) => c.value === product.category);
  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);
  const returnsNote =
    product.category === NON_RETURNABLE_CATEGORY
      ? "Made just for you, so no change-of-mind returns."
      : `Change-of-mind returns within ${CHANGE_OF_MIND_RETURN_DAYS} days.`;

  return (
    <ShopShell products={products} socialLinks={config.socialLinks}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(productJsonLd(product, config.categories))}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-htz-navy/60" aria-label="Breadcrumb">
          <Link href="/#shop" className="hover:text-htz-orange">
            Shop
          </Link>
          {category && (
            <>
              {" / "}
              <span>{category.label}</span>
            </>
          )}
        </nav>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
          <ProductGallery product={product} />

          <div className="flex flex-col gap-4">
            <ProductBadgeTag badge={product.badge} className="self-start" />
            <h1 className="font-display text-3xl font-bold text-htz-navy sm:text-4xl">
              {product.name}
            </h1>
            <StockBadge stock={product.stock} />
            {product.description && (
              <p className="text-lg text-htz-navy/80">{product.description}</p>
            )}

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <AddToCartForm
                product={product}
                colors={config.colors}
                sizeOptions={config.sizeOptions}
                large
              />
            </div>

            <ul className="flex flex-col gap-2 text-sm text-htz-navy/70">
              <li>🖨️ 3D printed in PLA and finished by hand in Australia.</li>
              <li>📦 Printed and posted within 3–5 business days. Free shipping over ${FREE_SHIPPING_THRESHOLD_AUD_CENTS / 100}.</li>
              <li>↩️ {returnsNote}</li>
              <li>⚠️ Not suitable for children under 3 – small parts.</li>
            </ul>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display mb-6 text-2xl font-semibold text-htz-navy">
              More {category?.label ?? "from the shop"}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  colors={config.colors}
                  sizeOptions={config.sizeOptions}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </ShopShell>
  );
}
