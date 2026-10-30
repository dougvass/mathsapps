"use client";

import { useEffect, useState } from "react";
import type { AdminOrder, CategoryDef, HolidayMode, Product, ToyOfWeek } from "@/lib/product-types";
import { SEASON_SETTINGS, type SeasonSetting } from "@/lib/season";

const cardClass = "rounded-2xl bg-white p-5 shadow-sm";
const inputClass = "rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none";

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

type Stats = { soldCounts: Record<string, number>; waiting: Record<string, number> };

function summarise(orders: AdminOrder[]) {
  const now = Date.now() / 1000;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const week = orders.filter((o) => o.createdAt > now - 7 * 24 * 60 * 60);
  const month = orders.filter((o) => o.createdAt * 1000 >= startOfMonth.getTime());
  const total = (list: AdminOrder[]) => list.reduce((sum, o) => sum + o.totalCents, 0);
  return {
    weekCents: total(week),
    weekOrders: week.length,
    monthCents: total(month),
    monthOrders: month.length,
    toPost: orders.filter((o) => !o.postedAt).length,
  };
}

// Money made, order counts and best sellers.
export function SalesDashboard({ products }: { products: Product[] }) {
  const [summary, setSummary] = useState<ReturnType<typeof summarise> | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error ?? "Couldn't load sales.");
        setSummary(summarise(data.orders));
      })
      .catch((err: Error) => setError(err.message));
    fetch("/api/admin/stats")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => data && setStats(data))
      .catch(() => {});
  }, []);

  const bestSellers = stats
    ? Object.entries(stats.soldCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({ name: products.find((p) => p.id === id)?.name ?? id, count }))
    : [];
  const waiting = stats
    ? Object.entries(stats.waiting)
        .sort((a, b) => b[1] - a[1])
        .map(([id, count]) => ({ name: products.find((p) => p.id === id)?.name ?? id, count }))
    : [];

  const tile = (label: string, value: string, sub: string, colour: string) => (
    <div className={`rounded-xl p-4 text-white ${colour}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{label}</p>
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="text-xs text-white/80">{sub}</p>
    </div>
  );

  return (
    <div className={cardClass}>
      <h2 className="font-display text-lg font-bold text-htz-navy">📊 Sales Dashboard</h2>
      {error && <p className="mt-2 text-sm text-htz-pink">{error}</p>}
      {summary && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tile("Last 7 days", money(summary.weekCents), `${summary.weekOrders} orders`, "bg-gradient-to-br from-htz-orange to-htz-pink")}
          {tile("This month", money(summary.monthCents), `${summary.monthOrders} orders`, "bg-gradient-to-br from-htz-teal to-htz-navy")}
          {tile("To post", String(summary.toPost), "orders waiting", "bg-gradient-to-br from-[#a855f7] to-htz-pink")}
          {tile("Average order", money(summary.monthOrders ? summary.monthCents / summary.monthOrders : 0), "this month", "bg-gradient-to-br from-[#22c55e] to-htz-teal")}
        </div>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold text-htz-navy">🏆 Best sellers</h3>
          {bestSellers.length === 0 ? (
            <p className="text-sm text-htz-navy/60">Counts start from the next paid order.</p>
          ) : (
            <ol className="mt-1 list-decimal pl-5 text-sm text-htz-navy">
              {bestSellers.map((item) => (
                <li key={item.name}>
                  {item.name} <span className="text-htz-navy/60">– {item.count} sold</span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div>
          <h3 className="text-sm font-bold text-htz-navy">🔔 Waiting for restock</h3>
          {waiting.length === 0 ? (
            <p className="text-sm text-htz-navy/60">Nobody is waiting for an out-of-stock toy.</p>
          ) : (
            <ul className="mt-1 text-sm text-htz-navy">
              {waiting.map((item) => (
                <li key={item.name}>
                  {item.name} <span className="text-htz-navy/60">– {item.count} waiting</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function HolidayEditor({ holiday, onChange }: { holiday: HolidayMode; onChange: (h: HolidayMode) => void }) {
  return (
    <div className={`${cardClass} ${holiday.enabled ? "ring-2 ring-htz-orange" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-htz-navy">🏖️ Holiday Mode</h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={holiday.enabled}
            onChange={(e) => onChange({ ...holiday, enabled: e.target.checked })}
            className="h-5 w-5 accent-htz-orange"
          />
          <span className="text-sm font-semibold text-htz-navy">On</span>
        </label>
      </div>
      <p className="text-sm text-htz-navy/60">
        Shows a notice on every page. People can still order – orders are posted when you&apos;re back.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[180px_1fr]">
        <label className="flex flex-col gap-1 text-sm font-semibold text-htz-navy">
          Back on
          <input type="date" value={holiday.until} onChange={(e) => onChange({ ...holiday, until: e.target.value })} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-htz-navy">
          Message (optional)
          <input
            type="text"
            value={holiday.message}
            maxLength={200}
            placeholder="e.g. Hugo is on holiday!"
            onChange={(e) => onChange({ ...holiday, message: e.target.value })}
            className={inputClass}
          />
        </label>
      </div>
    </div>
  );
}

export function ToyOfWeekEditor({
  value,
  products,
  onChange,
}: {
  value: ToyOfWeek;
  products: Product[];
  onChange: (value: ToyOfWeek) => void;
}) {
  return (
    <div className={cardClass}>
      <h2 className="font-display text-lg font-bold text-htz-navy">🌟 Toy of the Week</h2>
      <p className="text-sm text-htz-navy/60">A big spotlight on the homepage. Choose “None” to hide it.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[240px_1fr]">
        <select value={value.productId} onChange={(e) => onChange({ ...value, productId: e.target.value })} className={inputClass} aria-label="Toy of the week">
          <option value="">None</option>
          {products
            .filter((p) => p.active)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
        <input
          type="text"
          value={value.blurb}
          maxLength={200}
          placeholder="Why it's great (optional), e.g. Hugo's favourite this week!"
          onChange={(e) => onChange({ ...value, blurb: e.target.value })}
          className={inputClass}
          aria-label="Toy of the week message"
        />
      </div>
    </div>
  );
}

// Puts a whole category (or everything) on sale, and back again.
export function BulkPriceTool({
  products,
  categories,
  onChange,
}: {
  products: Product[];
  categories: CategoryDef[];
  onChange: (products: Product[]) => void;
}) {
  const [category, setCategory] = useState("");
  const [percent, setPercent] = useState(20);
  const inScope = (p: Product) => !category || p.category === category;
  const onSale = products.filter((p) => inScope(p) && p.wasPrice > 0).length;
  const scopeName = category ? categories.find((c) => c.value === category)?.label : "all products";

  function startSale() {
    if (percent <= 0 || percent >= 90) {
      window.alert("Choose a discount between 1% and 89%.");
      return;
    }
    if (!window.confirm(`Take ${percent}% off ${scopeName}? Remember to press Save Changes.`)) return;
    onChange(
      products.map((p) => {
        if (!inScope(p)) return p;
        const original = p.wasPrice > 0 ? p.wasPrice : p.price;
        return { ...p, wasPrice: original, price: Math.round(original * (100 - percent)) / 100 };
      })
    );
  }

  function endSale() {
    if (!window.confirm(`Put ${scopeName} back to normal prices? Remember to press Save Changes.`)) return;
    onChange(products.map((p) => (inScope(p) && p.wasPrice > 0 ? { ...p, price: p.wasPrice, wasPrice: 0 } : p)));
  }

  return (
    <div className={cardClass}>
      <h2 className="font-display text-lg font-bold text-htz-navy">💸 Sale Prices</h2>
      <p className="text-sm text-htz-navy/60">
        Lowers prices and shows the old price crossed out. End the sale to put them back.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} aria-label="Sale category">
          <option value="">All products</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-sm font-semibold text-htz-navy">
          <input
            type="number"
            min={1}
            max={89}
            value={percent}
            onChange={(e) => setPercent(Number(e.target.value))}
            className={`${inputClass} w-20`}
            aria-label="Percent off"
          />
          % off
        </label>
        <button type="button" onClick={startSale} className="rounded-full bg-htz-orange px-4 py-2 text-sm font-bold text-white shadow">
          Start sale
        </button>
        <button
          type="button"
          onClick={endSale}
          disabled={onSale === 0}
          className="rounded-full border border-htz-navy/20 px-4 py-2 text-sm font-semibold text-htz-navy disabled:opacity-40"
        >
          End sale{onSale > 0 ? ` (${onSale} on sale)` : ""}
        </button>
      </div>
    </div>
  );
}

export function SeasonEditor({ value, onChange }: { value: SeasonSetting; onChange: (value: SeasonSetting) => void }) {
  return (
    <div className={cardClass}>
      <h2 className="font-display text-lg font-bold text-htz-navy">🎄🎃 Christmas & Halloween decorations</h2>
      <p className="text-sm text-htz-navy/60">Snow or bats on the shop, a seasonal banner and festive colours.</p>
      <div className="mt-3 flex flex-col gap-2">
        {SEASON_SETTINGS.map((option) => (
          <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-htz-navy/10 px-4 py-3 text-htz-navy">
            <input
              type="radio"
              name="season"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="h-5 w-5 accent-htz-orange"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}
