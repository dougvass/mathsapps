"use client";

import { useState } from "react";

type Order = { number: string; date: string; items: string[]; totalCents: number; postedAt: string | null };

const STEPS = ["Order placed", "Being made", "Posted"];

export default function TrackOrder() {
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  async function lookUp(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setOrder(null);
    const response = await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, order: number }),
    }).catch(() => null);
    const data = await response?.json().catch(() => ({}));
    if (response?.ok) setOrder(data.order);
    else setError(data?.error ?? "Something went wrong. Please try again.");
    setBusy(false);
  }

  const step = order ? (order.postedAt ? 2 : 1) : 0;
  const input = "w-full rounded-xl border border-ink/20 bg-surface px-4 py-3 text-base text-ink focus:border-htz-orange focus:outline-none";

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-ink">📦 Track my order</h1>
      <form onSubmit={lookUp} className="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-sm">
        <label className="flex flex-col gap-1 font-semibold text-ink">
          Email you ordered with
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} autoComplete="email" />
        </label>
        <label className="flex flex-col gap-1 font-semibold text-ink">
          Order number <span className="text-sm font-normal text-ink/60">(on your thank-you page, like HTZ-AB12CD34)</span>
          <input required value={number} onChange={(e) => setNumber(e.target.value)} className={`${input} font-mono uppercase`} placeholder="HTZ-" />
        </label>
        <button type="submit" disabled={busy} className="rounded-full bg-htz-lime py-3 font-display text-lg font-bold text-htz-navy shadow disabled:opacity-50">
          {busy ? "Looking…" : "Find my order"}
        </button>
        {error && <p className="text-sm font-semibold text-htz-pink" role="alert">{error}</p>}
      </form>

      {order && (
        <section className="rounded-2xl bg-surface p-5 shadow-sm">
          <p className="text-sm text-ink/60">
            {order.number} · {new Date(order.date).toLocaleDateString("en-AU", { day: "numeric", month: "long" })} · ${(order.totalCents / 100).toFixed(2)}
          </p>
          <ol className="mt-4 flex items-center gap-2">
            {STEPS.map((label, i) => (
              <li key={label} className="flex flex-1 flex-col items-center gap-1 text-center text-sm">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${i <= step ? "bg-htz-lime text-htz-navy" : "bg-ink/10 text-ink/40"}`}>
                  {i <= step ? "✓" : i + 1}
                </span>
                <span className={i <= step ? "font-semibold text-ink" : "text-ink/50"}>{label}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 font-semibold text-ink">
            {order.postedAt
              ? `📮 Posted on ${new Date(order.postedAt).toLocaleDateString("en-AU", { day: "numeric", month: "long" })} – it usually arrives in 2–6 business days.`
              : "🖨️ We're making it now – most orders are posted within 3–5 business days."}
          </p>
          <ul className="mt-3 list-disc pl-5 text-sm text-ink/75">
            {order.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
