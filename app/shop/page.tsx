import type { Metadata } from "next";
import { loadShopData } from "@/lib/shop-data";
import { SITE_NAME } from "@/lib/site";
import ShopShell from "@/components/ShopShell";
import ShopBrowser, { PRICES, SORTS, type PriceKey, type SortKey } from "@/components/ShopBrowser";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export const metadata: Metadata = {
  title: `Shop All Fidget Toys | ${SITE_NAME}`,
  description: "Browse every 3D printed fidget toy, articulated animal and custom name keychain from HugosToyz.",
  alternates: { canonical: "/shop" },
};

export default async function Shop({ searchParams }: Props) {
  const params = await searchParams;
  const { config, shop } = await loadShopData();

  const category = first(params.category);
  const price = first(params.price);
  const sort = first(params.sort);

  return (
    <ShopShell shop={shop} socialLinks={config.socialLinks}>
      <ShopBrowser
        initial={{
          q: first(params.q).slice(0, 80),
          category: config.categories.some((c) => c.value === category) ? category : "",
          price: price in PRICES ? (price as PriceKey) : "",
          inStock: first(params.stock) === "1",
          sort: sort in SORTS ? (sort as SortKey) : "featured",
        }}
      />
    </ShopShell>
  );
}
