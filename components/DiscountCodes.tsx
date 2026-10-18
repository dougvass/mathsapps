"use client";

import { useEffect, useState } from "react";
import type { DiscountCode } from "@/lib/product-types";

const inputClass =
  "rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none";

function formatExpiry(expiresAt: number | null): string {
  if (!expiresAt) return "No expiry";
  return `Ends ${new Date(expiresAt * 1000).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

function status(code: DiscountCode): { text: string; style: string } {
  const expired = code.expiresAt !== null && code.expiresAt * 1000 < Date.now();
  const usedUp = code.maxRedemptions !== null && code.timesRedeemed >= code.maxRedemptions;
  if (!code.active) return { text: "Off", style: "bg-htz-navy/5 text-htz-navy/60" };
  if (expired) return { text: "Expired", style: "bg-htz-navy/5 text-htz-navy/60" };
  if (usedUp) return { text: "Used up", style: "bg-htz-navy/5 text-htz-navy/60" };
  return { text: "Active", style: "bg-htz-lime/40 text-htz-navy" };
}

export default function DiscountCodes() {
  const [codes, setCodes] = useState<DiscountCode[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [kind, setKind] = useState<"amount" | "percent">("amount");
  const [value, setValue] = useState("");
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [expiresOn, setExpiresOn] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newCode, setNewCode] = useState<DiscountCode | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/admin/discounts")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error ?? "Couldn't load discount codes.");
        setCodes(data.codes);
      })
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreateError(null);
    setNewCode(null);
    setCopied(false);
    setCreating(true);

    const response = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        value: Number(value),
        firstOrderOnly,
        expiresOn: expiresOn || undefined,
        maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setCreating(false);

    if (!response.ok) {
      setCreateError(data.error ?? "Couldn't create the code.");
      return;
    }
    setNewCode(data.code);
    setCodes((prev) => [data.code, ...(prev ?? [])]);
    setValue("");
  }

  async function handleTurnOff(id: string) {
    if (!window.confirm("Turn this code off? Customers won't be able to use it any more.")) return;
    const response = await fetch("/api/admin/discounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      window.alert(data.error ?? "Couldn't turn the code off.");
      return;
    }
    setCodes((prev) => prev?.map((code) => (code.id === id ? data.code : code)) ?? null);
  }

  async function copyNewCode() {
    if (!newCode) return;
    try {
      await navigator.clipboard.writeText(newCode.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-bold text-htz-navy">Discount Codes</h2>
      <p className="mt-1 text-sm text-htz-navy/60">
        Codes are created in Stripe straight away (no need to Save Changes). Customers enter
        them on the payment page under &quot;Add promotion code&quot;.
      </p>

      <form onSubmit={handleCreate} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-htz-navy">Discount</span>
          <div className="flex gap-2">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as "amount" | "percent")}
              className={inputClass}
            >
              <option value="amount">$ off</option>
              <option value="percent">% off</option>
            </select>
            <input
              type="number"
              required
              min={kind === "percent" ? 1 : 0.01}
              max={kind === "percent" ? 100 : undefined}
              step={kind === "percent" ? 1 : 0.01}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={kind === "percent" ? "e.g. 10" : "e.g. 5"}
              className={`${inputClass} w-full`}
            />
          </div>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-htz-navy">
            Ends on <span className="text-htz-navy/50">(optional)</span>
          </span>
          <input
            type="date"
            value={expiresOn}
            onChange={(e) => setExpiresOn(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-htz-navy">
            Max uses <span className="text-htz-navy/50">(optional, blank = unlimited)</span>
          </span>
          <input
            type="number"
            min={1}
            step={1}
            value={maxRedemptions}
            onChange={(e) => setMaxRedemptions(e.target.value)}
            placeholder="e.g. 50"
            className={inputClass}
          />
        </label>

        <label className="flex items-center gap-2 sm:mt-6">
          <input
            type="checkbox"
            checked={firstOrderOnly}
            onChange={(e) => setFirstOrderOnly(e.target.checked)}
            className="h-5 w-5 accent-htz-orange"
          />
          <span className="text-sm font-semibold text-htz-navy">First order only</span>
        </label>

        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <button
            type="submit"
            disabled={creating}
            className="rounded-full bg-htz-orange px-6 py-2 font-display font-bold text-white shadow transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create code"}
          </button>
          {createError && <span className="text-sm font-semibold text-htz-pink">{createError}</span>}
        </div>
      </form>

      {newCode && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-htz-lime/30 p-4">
          <span className="text-sm font-semibold text-htz-navy">New code ({newCode.label}):</span>
          <span className="font-mono text-2xl font-bold tracking-wider text-htz-navy">
            {newCode.code}
          </span>
          <button
            type="button"
            onClick={copyNewCode}
            className="rounded-full bg-white px-4 py-1 text-sm font-bold text-htz-navy shadow"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-htz-navy">Your codes</h3>
        {loadError && <p className="mt-2 text-sm text-htz-pink">{loadError}</p>}
        {!loadError && codes === null && <p className="mt-2 text-sm text-htz-navy/60">Loading…</p>}
        {codes?.length === 0 && (
          <p className="mt-2 text-sm text-htz-navy/60">No codes yet.</p>
        )}
        {codes && codes.length > 0 && (
          <ul className="mt-2 divide-y divide-htz-navy/10">
            {codes.map((code) => {
              const badge = status(code);
              const canTurnOff = code.active && badge.text === "Active";
              return (
                <li key={code.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                  <span className="font-mono font-bold text-htz-navy">{code.code}</span>
                  <span className="text-sm text-htz-navy">{code.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.style}`}>
                    {badge.text}
                  </span>
                  <span className="text-xs text-htz-navy/60">
                    Used {code.timesRedeemed}
                    {code.maxRedemptions !== null ? ` of ${code.maxRedemptions}` : ""} ·{" "}
                    {formatExpiry(code.expiresAt)}
                    {code.firstOrderOnly ? " · First order only" : ""}
                  </span>
                  {canTurnOff && (
                    <button
                      type="button"
                      onClick={() => handleTurnOff(code.id)}
                      className="ml-auto text-xs font-semibold text-htz-pink hover:underline"
                    >
                      Turn off
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
