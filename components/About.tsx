export default function About() {
  return (
    <section id="about" className="bg-htz-teal text-white">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">
          Made with love (and a lot of plastic spaghetti)
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-white/80">
          HugosToyz started with one 3D printer, one big idea, and a pile of
          fidget prototypes. Every toy is designed, printed, and finished by
          hand in small batches — built to spin, click, twist, and survive a
          backpack full of pencils. Whether you need something to keep your
          hands busy or a one-of-a-kind gift, we&apos;ve got you covered.
        </p>
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
