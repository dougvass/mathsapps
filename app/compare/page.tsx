import type { Metadata } from "next";
import { loadShopData } from "@/lib/shop-data";
import { SITE_NAME } from "@/lib/site";
import ShopShell from "@/components/ShopShell";
import ComparePage from "@/components/ComparePage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: `Compare Toys | ${SITE_NAME}`, robots: { index: false } };

export default async function Compare() {
  const { config, shop } = await loadShopData();
  return (
    <ShopShell shop={shop} socialLinks={config.socialLinks}>
      <ComparePage />
    </ShopShell>
  );
}
