import { getActiveProducts, getStoreConfig } from "@/lib/products";
import { homeJsonLd, jsonLdScript } from "@/lib/structured-data";
import ShopShell from "@/components/ShopShell";
import Hero from "@/components/Hero";
import SaleBanner from "@/components/SaleBanner";
import ProductGrid from "@/components/ProductGrid";
import Reviews from "@/components/Reviews";
import About from "@/components/About";
import FaqSection from "@/components/FaqSection";

// Always read the latest store data so admin edits show up without a
// redeploy (the store can be edited at runtime via Vercel Blob).
export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, config] = await Promise.all([getActiveProducts(), getStoreConfig()]);

  return (
    <ShopShell products={products} socialLinks={config.socialLinks}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(homeJsonLd(products, config.socialLinks))}
      />
      <Hero heroImage={config.heroImage} />
      <SaleBanner banner={config.banner} />
      <ProductGrid
        products={products}
        categories={config.categories}
        colors={config.colors}
        sizeOptions={config.sizeOptions}
      />
      <Reviews reviews={config.reviews} />
      <About />
      <FaqSection faqs={config.faqs} />
    </ShopShell>
  );
}
