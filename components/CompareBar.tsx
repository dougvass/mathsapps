"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompare, MAX_COMPARE } from "@/lib/local-lists";
import { useShop } from "@/lib/shop-context";

// Shows which toys are picked for comparing, with a button to compare them.
export default function CompareBar() {
  const { ids, clear } = useCompare();
  const { products } = useShop();
  const pathname = usePathname();
  const picked = ids.filter((id) => products.some((p) => p.id === id));
  if (picked.length === 0 || pathname === "/compare") return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-30 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-htz-navy p-3 text-white shadow-2xl">
      <span className="text-2xl" aria-hidden="true">⇄</span>
      <p className="flex-1 text-sm">
        <span className="font-bold">{picked.length}</span> of {MAX_COMPARE} toys picked
        {picked.length < 2 && <span className="block text-white/70">Pick one more to compare</span>}
      </p>
      <button type="button" onClick={clear} className="text-sm text-white/70 hover:text-white">
        Clear
      </button>
      {picked.length >= 2 && (
        <Link href="/compare" className="rounded-full bg-htz-lime px-4 py-2 text-sm font-bold text-htz-navy">
          Compare →
        </Link>
      )}
    </div>
  );
}
