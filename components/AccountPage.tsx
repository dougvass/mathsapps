"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "@/lib/account-context";
import { useShop } from "@/lib/shop-context";
import {
  BIRTHDAY_POINTS,
  POINTS_PER_DOLLAR,
  REDEEM_POINTS,
  REDEEM_VALUE_CENTS,
  REFERRAL_POINTS,
  REVIEW_POINTS,
  SIGNUP_POINTS,
  type AccountView,
  type Address,
} from "@/lib/rewards-rules";
import { SITE_URL } from "@/lib/site";
import ShareButton from "./ShareButton";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
const inputClass =
  "w-full rounded-lg border border-htz-navy/20 bg-white px-3 py-2 text-sm focus:border-htz-orange focus:outline-none";
const card = "rounded-2xl bg-white p-5 shadow-sm sm:p-6";

const ERRORS: Record<string, string> = {
  signin: "Sign-in didn't finish. Please try again.",
  save: "We couldn't save your account. Please try again in a minute.",
  setup: "Sign-in isn't switched on yet. Please check back soon!",
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function GoogleButton({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return <p className="rounded-xl bg-htz-cream p-4 text-sm text-htz-navy/70">Sign-in is coming soon! You can still shop as normal.</p>;
  }
  return (
    // A plain link: sign-in leaves the site for Google and comes back.
    <a
      href="/api/auth/google?next=/account"
      className="inline-flex items-center justify-center gap-3 rounded-full border-2 border-htz-navy/15 bg-white px-6 py-3 font-semibold text-htz-navy shadow-sm transition-transform hover:scale-[1.02] hover:border-htz-navy/30"
    >
      <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.5z" />
      </svg>
      Continue with Google
    </a>
  );
}

const EARN = [
  { icon: "🛍️", text: `${POINTS_PER_DOLLAR} point for every $1 you spend` },
  { icon: "👋", text: `${SIGNUP_POINTS} points just for joining` },
  { icon: "✍️", text: `${REVIEW_POINTS} points for your first review` },
  { icon: "🎂", text: `${BIRTHDAY_POINTS} points on your birthday, every year` },
  { icon: "🤝", text: `${REFERRAL_POINTS} points when a friend you invite makes their first order` },
];

function SignedOut({ googleEnabled, error }: { googleEnabled: boolean; error: string }) {
  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-2">
      <div className={`${card} flex flex-col gap-4`}>
        <h1 className="font-display text-3xl font-bold text-htz-navy">Sign in & earn rewards</h1>
        <p className="text-htz-navy/70">
          Collect points on every order and swap {REDEEM_POINTS} points for {money(REDEEM_VALUE_CENTS)} off. Your wishlist, orders and address are saved too.
        </p>
        {error && ERRORS[error] && <p className="text-sm font-semibold text-htz-pink">{ERRORS[error]}</p>}
        <GoogleButton enabled={googleEnabled} />
        <p className="text-xs text-htz-navy/50">
          No account needed to shop – signing in is optional. We only get your name, email and profile photo from Google. See our{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-htz-navy to-htz-teal p-6 text-white shadow-sm">
        <h2 className="font-display text-2xl font-bold">🎁 HugosToyz Rewards</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {EARN.map((item) => (
            <li key={item.text} className="flex gap-3">
              <span className="text-xl" aria-hidden="true">{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-xl bg-white/10 p-3 font-semibold text-htz-lime">
          {REDEEM_POINTS} points = {money(REDEEM_VALUE_CENTS)} off your next order
        </p>
      </div>
    </div>
  );
}

function PointsCard({ account, onChange }: { account: AccountView; onChange: () => Promise<void> }) {
  const [redeeming, setRedeeming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState("");
  const progress = Math.min(100, Math.round(((account.points % REDEEM_POINTS) / REDEEM_POINTS) * 100));
  const canRedeem = account.points >= REDEEM_POINTS;

  async function redeem() {
    setRedeeming(true);
    setMessage(null);
    const response = await fetch("/api/account/redeem", { method: "POST" }).catch(() => null);
    const data = await response?.json().catch(() => ({}));
    if (response?.ok) setMessage(`Your code is ${data.code} – use it in your cart!`);
    else setMessage(data?.error ?? "Something went wrong. Please try again.");
    await onChange();
    setRedeeming(false);
  }

  return (
    <section className="rounded-2xl bg-gradient-to-br from-htz-navy to-htz-teal p-6 text-white shadow-sm">
      <p className="text-sm text-white/70">Your points</p>
      <p className="font-display text-5xl font-bold text-htz-lime">{account.points}</p>
      {!canRedeem && (
        <>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
            <div className="h-full rounded-full bg-htz-lime" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-sm text-white/80">
            {REDEEM_POINTS - account.points} more points until {money(REDEEM_VALUE_CENTS)} off
          </p>
        </>
      )}
      <button
        type="button"
        onClick={redeem}
        disabled={!canRedeem || redeeming}
        className="mt-4 rounded-full bg-htz-lime px-6 py-2.5 font-display font-bold text-htz-navy shadow transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {redeeming ? "Making your code…" : `Swap ${REDEEM_POINTS} points for ${money(REDEEM_VALUE_CENTS)} off`}
      </button>
      {message && <p className="mt-3 font-semibold" role="status">{message}</p>}

      {account.rewardCodes.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-white/80">Your reward codes (one use each)</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {account.rewardCodes.map((reward) => (
              <li key={reward.code}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(reward.code).catch(() => {});
                    setCopied(reward.code);
                  }}
                  className="rounded-lg bg-white/10 px-3 py-1.5 font-mono text-sm hover:bg-white/20"
                  title="Copy code"
                >
                  {reward.code} · {money(reward.valueCents)} {copied === reward.code ? "✓ copied" : "⧉"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function BirthdayCard({ account, onChange }: { account: AccountView; onChange: () => Promise<void> }) {
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (account.birthday) {
    const [m, d] = account.birthday.split("-").map(Number);
    return (
      <p className="text-sm text-htz-navy/70">
        🎂 Birthday: <span className="font-semibold text-htz-navy">{`${d} ${MONTHS[m - 1]}`}</span> – we&apos;ll add {BIRTHDAY_POINTS} points each year.
      </p>
    );
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!window.confirm(`Save your birthday as ${day} ${MONTHS[Number(month) - 1]}? It can't be changed later.`)) return;
    const response = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birthday: `${month.padStart(2, "0")}-${day.padStart(2, "0")}` }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.error ?? "Couldn't save that.");
    else await onChange();
  }

  return (
    <form onSubmit={save} className="flex flex-wrap items-end gap-2">
      <p className="w-full text-sm font-semibold text-htz-navy">🎂 Add your birthday for {BIRTHDAY_POINTS} points every year</p>
      <select value={day} onChange={(e) => setDay(e.target.value)} aria-label="Birthday day" className={`${inputClass} w-24`} required>
        <option value="">Day</option>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Birthday month" className={`${inputClass} w-40`} required>
        <option value="">Month</option>
        {MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>{name}</option>
        ))}
      </select>
      <button type="submit" className="rounded-full bg-htz-lime px-5 py-2 text-sm font-bold text-htz-navy shadow">
        Save
      </button>
      {error && <p className="w-full text-sm text-htz-pink">{error}</p>}
    </form>
  );
}

function AddressCard({ address }: { address: Address }) {
  const [form, setForm] = useState(address);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const set = (key: keyof Address) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [key]: e.target.value });
    setState("idle");
  };

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setState("saving");
    const response = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: form }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) setState("saved");
    else {
      setError(data.error ?? "Couldn't save your address.");
      setState("error");
    }
  }

  return (
    <section className={card}>
      <h2 className="font-display text-xl font-bold text-htz-navy">📦 Delivery address</h2>
      <p className="text-sm text-htz-navy/60">Filled in for you at checkout. It also updates when you use a new address.</p>
      <form onSubmit={save} className="mt-4 grid grid-cols-2 gap-3">
        <label className="col-span-2 flex flex-col gap-1 text-sm font-semibold text-htz-navy">
          Name
          <input className={inputClass} value={form.name} onChange={set("name")} autoComplete="name" required />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-sm font-semibold text-htz-navy">
          Street address
          <input className={inputClass} value={form.line1} onChange={set("line1")} autoComplete="address-line1" required />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-sm font-semibold text-htz-navy">
          Unit, apartment (optional)
          <input className={inputClass} value={form.line2} onChange={set("line2")} autoComplete="address-line2" />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-sm font-semibold text-htz-navy sm:col-span-1">
          Suburb
          <input className={inputClass} value={form.city} onChange={set("city")} autoComplete="address-level2" required />
        </label>
        <div className="col-span-2 grid grid-cols-2 gap-3 sm:col-span-1">
          <label className="flex flex-col gap-1 text-sm font-semibold text-htz-navy">
            State
            <select className={inputClass} value={form.state} onChange={set("state")} required>
              <option value="">–</option>
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-htz-navy">
            Postcode
            <input className={inputClass} value={form.postcode} onChange={set("postcode")} inputMode="numeric" maxLength={4} autoComplete="postal-code" required />
          </label>
        </div>
        <div className="col-span-2 flex items-center gap-3">
          <button type="submit" disabled={state === "saving"} className="rounded-full bg-htz-lime px-6 py-2 text-sm font-bold text-htz-navy shadow disabled:opacity-50">
            {state === "saving" ? "Saving…" : "Save address"}
          </button>
          {state === "saved" && <span className="text-sm font-semibold text-green-700">Saved!</span>}
          {state === "error" && <span className="text-sm font-semibold text-htz-pink">{error}</span>}
        </div>
      </form>
    </section>
  );
}

function SignedIn({ account }: { account: AccountView }) {
  const { refresh, signOut } = useAccount();
  const { products } = useShop();
  const referralLink = `${SITE_URL}/?ref=${account.referralCode}`;
  const savedCount = account.wishlist.filter((id) => products.some((p) => p.id === id)).length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {account.picture && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={account.picture} alt="" referrerPolicy="no-referrer" className="h-12 w-12 rounded-full" />
          )}
          <div>
            <h1 className="font-display text-2xl font-bold text-htz-navy">Hi, {account.name.split(" ")[0]}!</h1>
            <p className="text-sm text-htz-navy/60">{account.email}</p>
          </div>
        </div>
        <button type="button" onClick={signOut} className="rounded-full border border-htz-navy/20 bg-white px-4 py-2 text-sm font-semibold text-htz-navy hover:border-htz-orange">
          Sign out
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <PointsCard account={account} onChange={refresh} />

        <section className={`${card} flex flex-col gap-4`}>
          <h2 className="font-display text-xl font-bold text-htz-navy">Ways to earn</h2>
          <ul className="flex flex-col gap-2 text-sm text-htz-navy/80">
            <li>🛍️ {POINTS_PER_DOLLAR} point for every $1 you spend</li>
            <li>
              ✍️ {account.reviewBonusUsed ? <span className="line-through">{`${REVIEW_POINTS} points for your first review`}</span> : `${REVIEW_POINTS} points for your first review`}
              {account.reviewBonusUsed && " ✓ done"}
            </li>
          </ul>
          <BirthdayCard account={account} onChange={refresh} />
          <div className="rounded-xl bg-htz-cream p-3">
            <p className="text-sm font-semibold text-htz-navy">🤝 Invite friends – get {REFERRAL_POINTS} points when they make their first order</p>
            <p className="mt-1 break-all font-mono text-xs text-htz-navy/70">{referralLink}</p>
            <div className="mt-2">
              <ShareButton title="Check out HugosToyz!" url={referralLink} />
            </div>
          </div>
        </section>
      </div>

      <section className={card}>
        <h2 className="font-display text-xl font-bold text-htz-navy">Your orders</h2>
        {account.orders.length === 0 ? (
          <p className="mt-2 text-sm text-htz-navy/60">
            No orders yet. <Link href="/shop" className="font-semibold text-htz-orange hover:underline">Start shopping</Link>
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-htz-navy/10">
            {account.orders.map((order) => (
              <li key={order.sessionId} className="flex flex-wrap items-start justify-between gap-2 py-3">
                <div>
                  <p className="text-sm font-semibold text-htz-navy">
                    {new Date(order.date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })} · {money(order.totalCents)}
                  </p>
                  <p className="text-sm text-htz-navy/70">{order.items.join(", ")}</p>
                  <p className="text-xs text-htz-teal">+{order.pointsEarned} points</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${order.posted ? "bg-green-100 text-green-800" : "bg-htz-orange/10 text-htz-orange"}`}>
                  {order.posted ? "📮 Posted" : "🖨️ Being made"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <AddressCard address={account.address} />
        <div className="flex flex-col gap-5">
          <section className={card}>
            <h2 className="font-display text-xl font-bold text-htz-navy">♥ Wishlist</h2>
            <p className="mt-1 text-sm text-htz-navy/70">
              {savedCount} saved – it follows you to any device you sign in on.
            </p>
            <Link href="/wishlist" className="mt-3 inline-block text-sm font-semibold text-htz-orange hover:underline">
              View wishlist →
            </Link>
          </section>
          <section className={card}>
            <h2 className="font-display text-xl font-bold text-htz-navy">Points history</h2>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {account.history.map((entry, i) => (
                <li key={`${entry.at}-${i}`} className="flex justify-between gap-3">
                  <span className="text-htz-navy/70">{entry.reason}</span>
                  <span className={`font-semibold ${entry.points >= 0 ? "text-green-700" : "text-htz-pink"}`}>
                    {entry.points >= 0 ? `+${entry.points}` : entry.points}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage({ googleEnabled, error }: { googleEnabled: boolean; error: string }) {
  const { account, loading } = useAccount();
  if (loading) return <p className="py-20 text-center text-htz-navy/60">Loading…</p>;
  if (!account) return <SignedOut googleEnabled={googleEnabled} error={error} />;
  return <SignedIn account={account} />;
}
