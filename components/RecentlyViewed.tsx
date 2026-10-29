"use client";

import { useEffect } from "react";
import { useRecentlyViewed } from "@/lib/local-lists";
import { useShop } from "@/lib/shop-context";
import type { Product } from "@/lib/product-types";
import ProductRow from "./ProductRow";

// Remembers this product as viewed and shows the others looked at before it.
export default function RecentlyViewed({ currentId }: { currentId: string }) {
  const { products } = useShop();
  const { ids, record } = useRecentlyViewed();

  useEffect(() => record(currentId), [currentId, record]);

  const recent = ids
    .filter((id) => id !== currentId)
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  return <ProductRow title="👀 Your recently viewed" products={recent} />;
}
