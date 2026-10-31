"use client";

import type { SocialLinks } from "@/lib/product-types";
import { CartProvider } from "@/lib/cart-context";
import { ShopDataProvider, type ShopData } from "@/lib/shop-context";
import Header from "./Header";
import Footer from "./Footer";
import CartToast from "./CartToast";
import BackToTop from "./BackToTop";
import ReferralCatcher from "./ReferralCatcher";
import DealsStrip from "./DealsStrip";
import SpinWheel from "./SpinWheel";
import QuizPrompt from "./QuizPrompt";
import SeasonEffects from "./SeasonEffects";
import CompareBar from "./CompareBar";
import BrokenImageHider from "./BrokenImageHider";
import { AccountProvider } from "@/lib/account-context";

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
    // shop-theme switches the shop (not admin) to dark colours when the device is in dark mode.
    <div className="shop-theme">
    <ShopDataProvider data={shop}>
      <AccountProvider>
        <CartProvider products={shop.products}>
          <DealsStrip />
          <Header />
          <main className="page-bg min-h-[60vh]">{children}</main>
          <Footer socialLinks={socialLinks} />
          <CartToast />
          <BackToTop />
          <ReferralCatcher />
          <SpinWheel />
          <QuizPrompt />
          <SeasonEffects />
          <CompareBar />
          <BrokenImageHider />
        </CartProvider>
      </AccountProvider>
    </ShopDataProvider>
    </div>
  );
}
