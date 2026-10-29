"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "@/lib/account-context";
import { saveDiscount } from "@/lib/checkout-client";
import { WHEEL_CODE_DAYS, WHEEL_POINTS, WHEEL_PRIZES, type WheelPrizeKey } from "@/lib/wheel";

const DONE_KEY = "htz-wheel-done";
const SLICE = 360 / WHEEL_PRIZES.length;

function slicePath(index: number): string {
  const start = ((index * SLICE - 90) * Math.PI) / 180;
  const end = (((index + 1) * SLICE - 90) * Math.PI) / 180;
  const x1 = 100 + 95 * Math.cos(start);
  const y1 = 100 + 95 * Math.sin(start);
  const x2 = 100 + 95 * Math.cos(end);
  const y2 = 100 + 95 * Math.sin(end);
  return `M100,100 L${x1},${y1} A95,95 0 0,1 ${x2},${y2} Z`;
}

function readDone(): boolean {
  try {
    const value = localStorage.getItem(DONE_KEY);
    return Boolean(value && Number(value) > Date.now());
  } catch {
    return false;
  }
}

function markDone(days: number) {
  try {
    localStorage.setItem(DONE_KEY, String(Date.now() + days * 24 * 60 * 60 * 1000));
  } catch {}
}

// Floating "Spin & win" button with a prize wheel (one spin per visitor).
export default function SpinWheel() {
  const { account, refresh } = useAccount();
  const [hidden, setHidden] = useState(true);
  const [open, setOpen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ prize: WheelPrizeKey; code: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHidden(readDone());
  }, []);

  if ((hidden || account?.spunWheel) && !open) return null;

  async function spin() {
    setSpinning(true);
    setError(null);
    const response = await fetch("/api/spin", { method: "POST" }).catch(() => null);
    const data = await response?.json().catch(() => ({}));
    if (!response?.ok) {
      setError(data?.error ?? "The wheel got stuck. Please try again.");
      setSpinning(false);
      if (response?.status === 409) markDone(365);
      return;
    }
    const index = WHEEL_PRIZES.findIndex((p) => p.key === data.prize);
    // Several full turns, then stop with the prize under the pointer at the top.
    const jitter = (Math.random() - 0.5) * SLICE * 0.6;
    setRotation((r) => r + 360 * 5 + (360 - (r % 360)) - (index * SLICE + SLICE / 2) + jitter);
    setTimeout(async () => {
      setResult({ prize: data.prize, code: data.code });
      setSpinning(false);
      markDone(data.prize === "again" ? 1 : 365);
      if (data.code) {
        // Put the code straight into the cart.
        const check = await fetch("/api/discounts/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: data.code }),
        }).catch(() => null);
        const checked = await check?.json().catch(() => null);
        if (check?.ok && checked?.discount) saveDiscount(checked.discount);
      }
      if (data.prize === "points") refresh();
    }, 4200);
  }

  function close() {
    setOpen(false);
    if (result || readDone()) setHidden(true);
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-20 left-3 z-30 flex items-center gap-1 rounded-full bg-gradient-to-r from-htz-pink to-htz-orange px-4 py-3 font-display font-bold text-white shadow-xl transition-transform hover:scale-105 sm:bottom-6"
        >
          🎡 Spin & win
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Spin the wheel">
          <div className="relative w-full max-w-sm rounded-3xl bg-surface p-6 text-center shadow-2xl">
            <button type="button" onClick={close} aria-label="Close" className="absolute right-4 top-3 text-2xl text-ink/50 hover:text-ink">
              ✕
            </button>
            <h2 className="font-display text-2xl font-bold text-ink">Spin & win! 🎡</h2>
            <p className="text-sm text-ink/60">One free spin – every slice is a prize (almost!)</p>

            <div className="relative mx-auto mt-4 h-64 w-64">
              <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1 text-3xl drop-shadow" aria-hidden="true">▼</div>
              <svg
                viewBox="0 0 200 200"
                className="h-full w-full"
                style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.2, 1)" : "none" }}
                aria-hidden="true"
              >
                {WHEEL_PRIZES.map((prize, i) => {
                  const angle = i * SLICE + SLICE / 2;
                  return (
                    <g key={prize.key}>
                      <path d={slicePath(i)} fill={prize.colour} stroke="#fff" strokeWidth="2" />
                      <text
                        x="100"
                        y="38"
                        transform={`rotate(${angle} 100 100)`}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={prize.label.length > 10 ? 8 : 11}
                        fontWeight="bold"
                      >
                        {prize.label}
                      </text>
                    </g>
                  );
                })}
                <circle cx="100" cy="100" r="14" fill="#c6f53e" stroke="#fff" strokeWidth="3" />
              </svg>
            </div>

            {result ? (
              <div className="mt-4" role="status">
                {result.prize === "again" ? (
                  <p className="font-display text-xl font-bold text-ink">So close! Try again tomorrow 🍀</p>
                ) : result.prize === "points" ? (
                  <p className="font-display text-xl font-bold text-ink">🎉 {WHEEL_POINTS} points added to your account!</p>
                ) : (
                  <>
                    <p className="font-display text-xl font-bold text-ink">
                      🎉 You won {WHEEL_PRIZES.find((p) => p.key === result.prize)?.label}!
                    </p>
                    <p className="mt-2 rounded-xl bg-htz-lime/30 px-4 py-2 font-mono text-lg font-bold text-ink">{result.code}</p>
                    <p className="mt-1 text-xs text-ink/60">
                      It&apos;s already in your cart. Use it within {WHEEL_CODE_DAYS} days.
                    </p>
                    <Link href="/shop" onClick={close} className="mt-3 inline-block rounded-full bg-htz-lime px-6 py-2.5 font-bold text-htz-navy shadow">
                      Start shopping
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={spin}
                  disabled={spinning}
                  className="mt-4 w-full rounded-full bg-gradient-to-r from-htz-pink to-htz-orange py-3 font-display text-xl font-bold text-white shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-60"
                >
                  {spinning ? "Spinning…" : "SPIN!"}
                </button>
                {!account && (
                  <p className="mt-2 text-xs text-ink/50">
                    <Link href="/account" onClick={close} className="underline">Sign in</Link> first for a chance at {WHEEL_POINTS} bonus points.
                  </p>
                )}
                {error && <p className="mt-2 text-sm font-semibold text-htz-pink">{error}</p>}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
