"use client";

import type { BannerSettings, CategoryDef, Product, SizeOption } from "@/lib/product-types";
import { CartProvider } from "@/lib/cart-context";
import Header from "./Header";
import Hero from "./Hero";
import SaleBanner from "./SaleBanner";
import ProductGrid from "./ProductGrid";
import About from "./About";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";

export default function StoreClient({
  products,
  categories,
  colors,
  sizeOptions,
  banner,
}: {
  products: Product[];
  categories: CategoryDef[];
  colors: string[];
  sizeOptions: SizeOption[];
  banner: BannerSettings;
}) {
  return (
    <CartProvider products={products}>
      <Header />
      <main>
        <Hero />
        <SaleBanner banner={banner} />
        <ProductGrid
          products={products}
          categories={categories}
          colors={colors}
          sizeOptions={sizeOptions}
        />
        <About />
      </main>
      <Footer />
      <CartDrawer />
    </CartProvider>
  );
}
