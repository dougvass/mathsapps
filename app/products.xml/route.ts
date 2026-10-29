import { getActiveProducts } from "@/lib/products";
import {
  absoluteUrl,
  FREE_SHIPPING_THRESHOLD_AUD_CENTS,
  productUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  STANDARD_SHIPPING_AUD_CENTS,
} from "@/lib/site";

// Google Merchant Center product feed, fetched on a schedule so price, stock
// and photo changes made in the admin panel reach Google Shopping.
export const dynamic = "force-dynamic";

function xml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  // Google requires a photo for every listing, so products without one are left
  // out until a photo is uploaded.
  const products = (await getActiveProducts()).filter((product) => product.image);
  const shipping = (STANDARD_SHIPPING_AUD_CENTS / 100).toFixed(2);
  const freeOver = (FREE_SHIPPING_THRESHOLD_AUD_CENTS / 100).toFixed(2);

  const items = products
    .map(
      (product) => `    <item>
      <g:id>${xml(product.id)}</g:id>
      <g:title>${xml(product.name)}</g:title>
      <g:description>${xml(product.description || product.name)}</g:description>
      <g:link>${xml(productUrl(product.id))}</g:link>
      <g:image_link>${xml(absoluteUrl(product.image))}</g:image_link>${product.gallery
        .map((photo) => `\n      <g:additional_image_link>${xml(absoluteUrl(photo))}</g:additional_image_link>`)
        .join("")}
      <g:availability>${product.stock === "out-of-stock" ? "out_of_stock" : "in_stock"}</g:availability>
      <g:price>${product.price.toFixed(2)} AUD</g:price>
      <g:condition>new</g:condition>
      <g:brand>${xml(SITE_NAME)}</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>Toys &amp; Games &gt; Toys</g:google_product_category>
      <g:shipping>
        <g:country>AU</g:country>
        <g:service>Standard Shipping</g:service>
        <g:price>${shipping} AUD</g:price>
      </g:shipping>
      <g:free_shipping_threshold>
        <g:country>AU</g:country>
        <g:price_threshold>${freeOver} AUD</g:price_threshold>
      </g:free_shipping_threshold>
      <g:min_handling_time>3</g:min_handling_time>
      <g:max_handling_time>5</g:max_handling_time>
    </item>`
    )
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xml(SITE_NAME)}</title>
    <link>${xml(SITE_URL)}</link>
    <description>${xml(SITE_DESCRIPTION)}</description>
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
