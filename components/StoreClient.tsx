"use client";

import type { Product } from "@/lib/product-types";
import { CartProvider } from "@/lib/cart-context";
import Header from "./Header";
import Hero from "./Hero";
import ProductGrid from "./ProductGrid";
import About from "./About";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";

export default function StoreClient({ products }: { products: Product[] }) {
  return (
    <CartProvider products={products}>
      <Header />
      <main>
        <Hero />
        <ProductGrid products={products} />
        <About />
      </main>
      <Footer />
      <CartDrawer />
    </CartProvider>
  );
}
