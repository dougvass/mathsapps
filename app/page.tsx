import { getActiveProducts, getStoreConfig } from "@/lib/products";
import StoreClient from "@/components/StoreClient";

// Always read the latest store data so admin edits show up without a
// redeploy (the store can be edited at runtime via Vercel Blob).
export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, config] = await Promise.all([getActiveProducts(), getStoreConfig()]);

  return (
    <StoreClient
      products={products}
      categories={config.categories}
      colors={config.colors}
      sizeOptions={config.sizeOptions}
    />
  );
}
