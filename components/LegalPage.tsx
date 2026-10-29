import Link from "next/link";
import { getActiveProducts, getStoreConfig } from "@/lib/products";
import ShopShell from "./ShopShell";

// Shared layout for the plain-text policy pages.
export default async function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  const [products, config] = await Promise.all([getActiveProducts(), getStoreConfig()]);

  return (
    <ShopShell products={products} socialLinks={config.socialLinks}>
      <article className="mx-auto max-w-3xl px-4 py-10 text-htz-navy/80 sm:px-6 lg:px-8 [&_a]:font-semibold [&_a]:text-htz-orange [&_a:hover]:underline [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-htz-navy [&_li]:mt-1 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
        <Link href="/" className="text-sm">
          ← Back to the shop
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold text-htz-navy sm:text-4xl">{title}</h1>
        <p className="text-sm text-htz-navy/50">Last updated {updated}</p>
        {children}
      </article>
    </ShopShell>
  );
}
