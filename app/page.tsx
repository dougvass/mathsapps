import { loadShopData } from "@/lib/shop-data";
import { homeJsonLd, jsonLdScript } from "@/lib/structured-data";
import ShopShell from "@/components/ShopShell";
import HomeCarousel from "@/components/HomeCarousel";
import HomeRows from "@/components/HomeRows";
import Reviews from "@/components/Reviews";
import About from "@/components/About";
import FaqSection from "@/components/FaqSection";

// Always read the latest store data so admin edits show up without a
// redeploy (the store can be edited at runtime via Vercel Blob).
export const dynamic = "force-dynamic";

export default async function Home() {
  const { products, config, reviews, shop } = await loadShopData();

  return (
    <ShopShell shop={shop} socialLinks={config.socialLinks}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(homeJsonLd(products, config.socialLinks))}
      />
      <HomeCarousel heroImage={config.heroImage} text={config.homeText} banner={config.banner} />
      <HomeRows />
      <Reviews reviews={reviews} />
      <About text={config.homeText} />
      <FaqSection faqs={config.faqs} />
    </ShopShell>
  );
}
