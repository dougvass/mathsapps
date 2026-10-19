import { getActiveProducts, getStoreConfig } from "@/lib/products";
import type { CategoryDef, Product } from "@/lib/product-types";
import {
  absoluteUrl,
  CHANGE_OF_MIND_RETURN_DAYS,
  NON_RETURNABLE_CATEGORY,
  productUrl,
  SITE_ALTERNATE_NAMES,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_PROFILE_URLS,
  STANDARD_SHIPPING_AUD_CENTS,
} from "@/lib/site";
import StoreClient from "@/components/StoreClient";

// Always read the latest store data so admin edits show up without a
// redeploy (the store can be edited at runtime via Vercel Blob).
export const dynamic = "force-dynamic";

// Google doesn't accept MadeToOrder, so made-to-order items count as InStock
// (available to buy now).
function availability(product: Product): string {
  return product.stock === "out-of-stock"
    ? "https://schema.org/OutOfStock"
    : "https://schema.org/InStock";
}

// Matches the checkout's flat rate and the dispatch/delivery times shown on the site.
const SHIPPING_DETAILS = {
  "@type": "OfferShippingDetails",
  shippingRate: {
    "@type": "MonetaryAmount",
    value: (STANDARD_SHIPPING_AUD_CENTS / 100).toFixed(2),
    currency: "AUD",
  },
  shippingDestination: { "@type": "DefinedRegion", addressCountry: "AU" },
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    handlingTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 5, unitCode: "DAY" },
    transitTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 7, unitCode: "DAY" },
  },
};

function returnPolicy(product: Product) {
  if (product.category === NON_RETURNABLE_CATEGORY) {
    return {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "AU",
      returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    };
  }
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "AU",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: CHANGE_OF_MIND_RETURN_DAYS,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
  };
}

// Structured data so search engines understand the shop and its products.
function storeJsonLd(products: Product[], categories: CategoryDef[]) {
  const storeId = `${SITE_URL}/#store`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        // Tells Google the site's name for search results, and its other spellings.
        "@type": "WebSite",
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAMES,
        url: `${SITE_URL}/`,
        publisher: { "@id": storeId },
      },
      {
        "@type": "OnlineStore",
        "@id": storeId,
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAMES,
        ...(SOCIAL_PROFILE_URLS.length > 0 ? { sameAs: SOCIAL_PROFILE_URLS } : {}),
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
          url: productUrl(product.id),
          price: product.price.toFixed(2),
          priceCurrency: "AUD",
          availability: availability(product),
          shippingDetails: SHIPPING_DETAILS,
          hasMerchantReturnPolicy: returnPolicy(product),
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
