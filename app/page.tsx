import { getActiveProducts } from "@/lib/products";
import StoreClient from "@/components/StoreClient";

export default function Home() {
  const products = getActiveProducts();
  return <StoreClient products={products} />;
}
