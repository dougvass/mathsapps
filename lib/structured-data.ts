import type { CategoryDef, Product, SocialLinks } from "./product-types";
import { productPhotos } from "./product-types";
import {
  absoluteUrl,
  CHANGE_OF_MIND_RETURN_DAYS,
  CONTACT_EMAIL,
  NON_RETURNABLE_CATEGORY,
  productUrl,
  SITE_ALTERNATE_NAMES,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  STANDARD_SHIPPING_AUD_CENTS,
} from "./site";

// schema.org data so search engines understand the shop and its products.

const STORE_ID = `${SITE_URL}/#store`;

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

export function homeJsonLd(products: Product[], socialLinks: SocialLinks) {
  const sameAs = Object.values(socialLinks).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        // Tells Google the site's name for search results, and its other spellings.
        "@type": "WebSite",
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAMES,
        url: `${SITE_URL}/`,
        publisher: { "@id": STORE_ID },
      },
      {
        "@type": "OnlineStore",
        "@id": STORE_ID,
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAMES,
        ...(sameAs.length > 0 ? { sameAs } : {}),
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        email: CONTACT_EMAIL,
        areaServed: { "@type": "Country", name: "Australia" },
      },
      {
        "@type": "ItemList",
        itemListElement: products.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: productUrl(product.id),
          name: product.name,
        })),
      },
    ],
  };
}

export function productJsonLd(product: Product, categories: CategoryDef[]) {
  const photos = productPhotos(product).map(absoluteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    category: categories.find((c) => c.value === product.category)?.label,
    brand: { "@type": "Brand", name: SITE_NAME },
    ...(photos.length > 0 ? { image: photos } : {}),
    offers: {
      "@type": "Offer",
      url: productUrl(product.id),
      price: product.price.toFixed(2),
      priceCurrency: "AUD",
      availability: availability(product),
      shippingDetails: SHIPPING_DETAILS,
      hasMerchantReturnPolicy: returnPolicy(product),
      seller: { "@type": "OnlineStore", "@id": STORE_ID, name: SITE_NAME },
    },
  };
}

export function jsonLdScript(data: unknown): { __html: string } {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
