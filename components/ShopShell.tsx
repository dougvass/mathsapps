"use client";

import type { SocialLinks } from "@/lib/product-types";
import { CartProvider } from "@/lib/cart-context";
import { ShopDataProvider, type ShopData } from "@/lib/shop-context";
import Header from "./Header";
import Footer from "./Footer";
import CartToast from "./CartToast";
import BackToTop from "./BackToTop";

// Shop data, cart, header, footer and pop-ups shared by every shop page.
export default function ShopShell({
  shop,
  socialLinks,
  children,
}: {
  shop: ShopData;
  socialLinks: SocialLinks;
  children: React.ReactNode;
}) {
  return (
    <ShopDataProvider data={shop}>
      <CartProvider products={shop.products}>
        <Header />
        <main className="min-h-[60vh] bg-[#f4f5f7]">{children}</main>
        <Footer socialLinks={socialLinks} />
        <CartToast />
        <BackToTop />
      </CartProvider>
    </ShopDataProvider>
  );
}
