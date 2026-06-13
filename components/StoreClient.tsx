"use client";

import type { CategoryDef, Product, SizeOption } from "@/lib/product-types";
import { CartProvider } from "@/lib/cart-context";
import Header from "./Header";
import Hero from "./Hero";
import ProductGrid from "./ProductGrid";
import About from "./About";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";

export default function StoreClient({
  products,
  categories,
  colors,
  sizeOptions,
}: {
  products: Product[];
  categories: CategoryDef[];
  colors: string[];
  sizeOptions: SizeOption[];
}) {
  return (
    <CartProvider products={products}>
      <Header />
      <main>
        <Hero />
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
