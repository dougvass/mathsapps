import type { Metadata } from "next";
import Link from "next/link";
import ClearCartOnMount from "@/components/ClearCartOnMount";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Order placed | HugosToyz",
  robots: { index: false },
};

export default function SuccessPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-htz-cream px-6 text-center">
      <Link
        href="/"
        className="fixed left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-htz-navy shadow transition-transform hover:scale-105 active:scale-95"
      >
        ← Back to Store
      </Link>
      <p className="text-6xl">🎉</p>
      <h1 className="font-display mt-4 text-3xl font-bold text-htz-navy sm:text-4xl">
        Order placed!
      </h1>
      <p className="mt-3 max-w-md text-htz-navy/70">
        Thanks for shopping with HugosToyz! We&apos;ll get your fidgets
        printing and packed up super soon. Keep an eye on your inbox for a
        confirmation email.
      </p>
      <p className="mt-3 text-sm text-htz-navy/60">
        Questions about your order? Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-htz-orange hover:underline">
          {CONTACT_EMAIL}
        </a>
      </p>
      <ClearCartOnMount />
      <Link
        href="/"
        className="mt-8 rounded-full bg-htz-lime px-8 py-3 font-display text-lg font-bold text-htz-navy shadow transition-transform hover:scale-105 active:scale-95"
      >
        Back to the shop
      </Link>
    </main>
  );
}
