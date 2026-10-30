import type { Metadata } from "next";
import Link from "next/link";
import ClearCartOnMount from "@/components/ClearCartOnMount";
import { CONTACT_EMAIL } from "@/lib/site";
import { stripeClient } from "@/lib/account-view";
import { issueGiftCards, type IssuedGiftCard } from "@/lib/gift-cards";
import { orderNumber } from "@/lib/order-number";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Gift card codes for this order (made now if the webhook hasn't yet).
async function giftCardsFor(sessionId: string): Promise<IssuedGiftCard[]> {
  const stripe = stripeClient();
  if (!stripe || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return [];
  try {
    return await issueGiftCards(stripe, sessionId);
  } catch (error) {
    console.error("Gift cards on thank-you page failed:", error);
    return [];
  }
}

export const metadata: Metadata = {
  title: "Order placed | HugosToyz",
  robots: { index: false },
};

export default async function SuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const sessionId = typeof params.session_id === "string" ? params.session_id : "";
  const giftCards = sessionId ? await giftCardsFor(sessionId) : [];

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
        Track your order any time on our <Link href="/track" className="font-semibold text-htz-orange hover:underline">order tracking page</Link>. Questions? Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-htz-orange hover:underline">
          {CONTACT_EMAIL}
        </a>
      </p>
      {sessionId && (
        <p className="mt-4 rounded-full bg-white px-5 py-2 font-semibold text-htz-navy shadow-sm">
          Order number: <span className="font-mono">{orderNumber(sessionId)}</span>
        </p>
      )}
      {giftCards.length > 0 && (
        <div className="mt-6 w-full max-w-md rounded-3xl bg-gradient-to-br from-[#0ea5e9] to-[#7c3aed] p-6 text-white shadow-lg">
          <p className="font-display text-2xl font-bold">🎟️ Your gift {giftCards.length === 1 ? "card" : "cards"}</p>
          <p className="text-sm text-white/85">Copy {giftCards.length === 1 ? "this code" : "these codes"} into a card or message. Each works once at checkout.</p>
          <ul className="mt-4 flex flex-col gap-2">
            {giftCards.map((card) => (
              <li key={card.code} className="flex items-center justify-between rounded-xl bg-white/15 px-4 py-3">
                <span className="select-all font-mono text-xl font-bold">{card.code}</span>
                <span className="font-display text-xl font-bold">${card.valueCents / 100}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-white/75">Take a screenshot so you don&apos;t lose {giftCards.length === 1 ? "it" : "them"}!</p>
        </div>
      )}
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
