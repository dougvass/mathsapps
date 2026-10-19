"use client";

import type { Product, SocialLinks } from "@/lib/product-types";
import { CartProvider } from "@/lib/cart-context";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";

// Cart, header, footer and cart drawer shared by every shop page.
export default function ShopShell({
  products,
  socialLinks,
  children,
}: {
  products: Product[];
  socialLinks: SocialLinks;
  children: React.ReactNode;
}) {
  return (
    <CartProvider products={products}>
      <Header />
      <main>{children}</main>
      <Footer socialLinks={socialLinks} />
      <CartDrawer />
    </CartProvider>
  );
}
