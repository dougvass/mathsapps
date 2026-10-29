import type { Metadata } from "next";
import { loadShopData } from "@/lib/shop-data";
import { SITE_NAME } from "@/lib/site";
import ShopShell from "@/components/ShopShell";
import FidgetQuiz from "@/components/FidgetQuiz";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Fidget Quiz – Find Your Perfect Fidget Toy | ${SITE_NAME}`,
  description: "Answer 3 quick questions and we'll pick the perfect 3D printed fidget toy for you.",
  alternates: { canonical: "/quiz" },
};

export default async function Quiz() {
  const { config, shop } = await loadShopData();
  return (
    <ShopShell shop={shop} socialLinks={config.socialLinks}>
      <FidgetQuiz />
    </ShopShell>
  );
}
