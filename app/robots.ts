import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /api/images stays crawlable so product photos can appear in Google Images.
      disallow: ["/api/admin/", "/api/checkout"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
