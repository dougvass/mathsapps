import type { Metadata } from "next";
import { loadShopData } from "@/lib/shop-data";
import { SITE_NAME } from "@/lib/site";
import ShopShell from "@/components/ShopShell";
import WishlistPage from "@/components/WishlistPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Your Wishlist | ${SITE_NAME}`,
  robots: { index: false },
};

export default async function Wishlist() {
  const { config, shop } = await loadShopData();
  return (
    <ShopShell shop={shop} socialLinks={config.socialLinks}>
      <WishlistPage />
    </ShopShell>
  );
}
