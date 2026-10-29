import type { Metadata } from "next";
import { loadShopData } from "@/lib/shop-data";
import ShopShell from "@/components/ShopShell";
import CartPage from "@/components/CartPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Cart | HugosToyz",
  robots: { index: false },
};

export default async function Cart() {
  const { shop, config } = await loadShopData();
  return (
    <ShopShell shop={shop} socialLinks={config.socialLinks}>
      <CartPage />
    </ShopShell>
  );
}
