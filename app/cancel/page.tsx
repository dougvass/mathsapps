import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-htz-cream px-6 text-center">
      <p className="text-6xl">😅</p>
      <h1 className="font-display mt-4 text-3xl font-bold text-htz-navy sm:text-4xl">
        Checkout cancelled
      </h1>
      <p className="mt-3 max-w-md text-htz-navy/70">
        No worries — your cart is still saved. Head back to the shop whenever
        you&apos;re ready.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-htz-lime px-8 py-3 font-display text-lg font-bold text-htz-navy shadow transition-transform hover:scale-105 active:scale-95"
      >
        Back to the shop
      </Link>
    </main>
  );
}
