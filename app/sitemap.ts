import type { MetadataRoute } from "next";
import { getActiveProducts } from "@/lib/products";
import { productUrl, SITE_URL } from "@/lib/site";

// Product list changes from the admin panel, so build the sitemap per request.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getActiveProducts();
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    ...products.map((product) => ({
      url: productUrl(product.id),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
