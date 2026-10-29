import type { HomeText } from "@/lib/product-types";

export default function About({ text }: { text: HomeText }) {
  return (
    <section id="about" className="scroll-mt-36 bg-htz-teal text-white">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">
          {text.aboutTitle}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl whitespace-pre-line text-white/80">{text.aboutText}</p>
        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/5 p-5">
            <p className="text-3xl">🖨️</p>
            <p className="mt-2 font-display font-semibold">3D Printed</p>
            <p className="mt-1 text-sm text-white/70">Designed and printed in-house.</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-5">
            <p className="text-3xl">🎨</p>
            <p className="mt-2 font-display font-semibold">Made to Order</p>
            <p className="mt-1 text-sm text-white/70">Custom colours and sizes available.</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-5">
            <p className="text-3xl">📦</p>
            <p className="mt-2 font-display font-semibold">Small Batch</p>
            <p className="mt-1 text-sm text-white/70">Packed with care, shipped with love.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
