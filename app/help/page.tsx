import type { Metadata } from "next";
import Link from "next/link";
import { loadShopData } from "@/lib/shop-data";
import {
  CHANGE_OF_MIND_RETURN_DAYS,
  CONTACT_EMAIL,
  FAULTY_ITEM_REPORT_DAYS,
  FREE_SHIPPING_THRESHOLD_AUD_CENTS,
  SITE_NAME,
} from "@/lib/site";
import ShopShell from "@/components/ShopShell";
import FaqSection from "@/components/FaqSection";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Help – How to Order, Shipping & Returns | ${SITE_NAME}`,
  description: "How ordering works, shipping times, returns and how to contact HugosToyz.",
  alternates: { canonical: "/help" },
};

const STEPS = [
  { icon: "🛍️", title: "Pick your toys", text: "Choose a toy, its size and colour, then tap Add to Cart or Buy Now." },
  { icon: "🖨️", title: "We print it", text: "Every toy is 3D printed and finished by hand in Australia." },
  { icon: "📦", title: "We post it", text: "Most orders are posted within 3–5 business days." },
];

export default async function Help() {
  const { config, shop } = await loadShopData();
  const box = "rounded-2xl bg-surface p-5 shadow-sm";

  return (
    <ShopShell shop={shop} socialLinks={config.socialLinks}>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <h1 className="font-display text-4xl font-bold text-ink">❓ Help</h1>
        <Link href="/track" className="flex items-center gap-3 self-start rounded-2xl bg-htz-navy px-5 py-4 font-display text-xl font-bold text-htz-lime shadow-md">
          📦 Track my order →
        </Link>

        <section className={box}>
          <h2 className="font-display text-2xl font-bold text-ink">How ordering works</h2>
          <ol className="mt-4 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-xl bg-surface-2 p-4">
                <p className="text-4xl" aria-hidden="true">{step.icon}</p>
                <p className="mt-2 font-display text-lg font-bold text-ink">{`${i + 1}. ${step.title}`}</p>
                <p className="text-ink/75">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className={box}>
            <h2 className="font-display text-xl font-bold text-ink">🚚 Shipping</h2>
            <p className="mt-2 text-ink/75">
              {`Australia-wide. Free standard shipping on orders over $${FREE_SHIPPING_THRESHOLD_AUD_CENTS / 100}. You can also choose free local pickup at checkout.`}
            </p>
          </section>
          <section className={box}>
            <h2 className="font-display text-xl font-bold text-ink">↩️ Returns</h2>
            <p className="mt-2 text-ink/75">
              {`Changed your mind? Return unused toys within ${CHANGE_OF_MIND_RETURN_DAYS} days. Faulty? Tell us within ${FAULTY_ITEM_REPORT_DAYS} days. Custom-made items can't be returned for a change of mind.`}
            </p>
          </section>
          <section className={box}>
            <h2 className="font-display text-xl font-bold text-ink">🎨 Custom orders</h2>
            <p className="mt-2 text-ink/75">
              Want your own design? Try <Link href="/shop?category=custom" className="font-semibold text-htz-orange underline">Design Your Own</Link>, or upload a 3D file and get an instant price.
            </p>
          </section>
          <section className={box}>
            <h2 className="font-display text-xl font-bold text-ink">✉️ Contact us</h2>
            <p className="mt-2 text-ink/75">
              Email <a href={`mailto:${CONTACT_EMAIL}`} className="break-all font-semibold text-htz-orange underline">{CONTACT_EMAIL}</a> – we usually reply within a day.
            </p>
          </section>
        </div>
      </div>
      <FaqSection faqs={config.faqs} />
    </ShopShell>
  );
}
