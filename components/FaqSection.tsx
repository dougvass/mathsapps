import type { Faq } from "@/lib/product-types";

export default function FaqSection({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) return null;

  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-36 px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="mb-8 text-center font-display text-3xl font-bold text-ink sm:text-4xl">
        Questions? We&apos;ve got answers
      </h2>
      <div className="flex flex-col gap-3">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-2xl bg-surface p-5 shadow-sm open:shadow-md"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold text-ink">
              {faq.question}
              <span
                className="text-2xl text-htz-orange transition-transform group-open:rotate-45"
                aria-hidden="true"
              >
                +
              </span>
            </summary>
            <p className="mt-3 whitespace-pre-line text-ink/75">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
