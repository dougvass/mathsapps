import { getActiveProducts, getStoreConfig } from "@/lib/products";
import type { CategoryDef, Product } from "@/lib/product-types";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import StoreClient from "@/components/StoreClient";

// Always read the latest store data so admin edits show up without a
// redeploy (the store can be edited at runtime via Vercel Blob).
export const dynamic = "force-dynamic";

function availability(product: Product): string {
  if (product.stock === "out-of-stock") return "https://schema.org/OutOfStock";
  if (product.stock === "made-to-order") return "https://schema.org/MadeToOrder";
  return "https://schema.org/InStock";
}

// Structured data so search engines understand the shop and its products.
function storeJsonLd(products: Product[], categories: CategoryDef[]) {
  const storeId = `${SITE_URL}/#store`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "OnlineStore",
        "@id": storeId,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        email: "hello@hugostoyz.com",
        areaServed: { "@type": "Country", name: "Australia" },
      },
      ...products.map((product) => ({
        "@type": "Product",
        name: product.name,
        description: product.description,
        category: categories.find((c) => c.value === product.category)?.label,
        brand: { "@type": "Brand", name: SITE_NAME },
        ...(product.image ? { image: absoluteUrl(product.image) } : {}),
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}/#shop`,
          price: product.price.toFixed(2),
          priceCurrency: "AUD",
          availability: availability(product),
          seller: { "@id": storeId },
        },
      })),
    ],
  };
}

export default async function Home() {
  const [products, config] = await Promise.all([getActiveProducts(), getStoreConfig()]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(storeJsonLd(products, config.categories)).replace(/</g, "\\u003c"),
        }}
      />
      <StoreClient
        products={products}
        categories={config.categories}
        colors={config.colors}
        sizeOptions={config.sizeOptions}
        banner={config.banner}
      />
    </>
  );
}
