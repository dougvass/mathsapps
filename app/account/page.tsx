import type { Metadata } from "next";
import { loadShopData } from "@/lib/shop-data";
import { googleConfigured } from "@/lib/user-session";
import { SITE_NAME } from "@/lib/site";
import ShopShell from "@/components/ShopShell";
import AccountPage from "@/components/AccountPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Your Account & Rewards | ${SITE_NAME}`,
  robots: { index: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Account({ searchParams }: Props) {
  const params = await searchParams;
  const { config, shop } = await loadShopData();
  const error = typeof params.error === "string" ? params.error : "";
  return (
    <ShopShell shop={shop} socialLinks={config.socialLinks}>
      <AccountPage googleEnabled={googleConfigured()} error={error} />
    </ShopShell>
  );
}
