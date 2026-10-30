import type { Metadata } from "next";
import { loadShopData } from "@/lib/shop-data";
import { SITE_NAME } from "@/lib/site";
import ShopShell from "@/components/ShopShell";
import DealsPage from "@/components/DealsPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Deals – Bundles, Free Shipping & Sales | ${SITE_NAME}`,
  description: "Buy 3 or more fidget toys for 10% off, free shipping over $50, and toys on sale.",
  alternates: { canonical: "/deals" },
};

export default async function Deals() {
  const { config, shop } = await loadShopData();
  return (
    <ShopShell shop={shop} socialLinks={config.socialLinks}>
      <DealsPage />
    </ShopShell>
  );
}
