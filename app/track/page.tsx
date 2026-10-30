import type { Metadata } from "next";
import { loadShopData } from "@/lib/shop-data";
import { SITE_NAME } from "@/lib/site";
import ShopShell from "@/components/ShopShell";
import TrackOrder from "@/components/TrackOrder";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: `Track My Order | ${SITE_NAME}`, robots: { index: false } };

export default async function Track() {
  const { config, shop } = await loadShopData();
  return (
    <ShopShell shop={shop} socialLinks={config.socialLinks}>
      <TrackOrder />
    </ShopShell>
  );
}
