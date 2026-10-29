import crypto from "crypto";
import { jsonFile } from "./json-file";
import {
  BIRTHDAY_POINTS,
  REFERRAL_POINTS,
  REVIEW_POINTS,
  SIGNUP_POINTS,
  type AccountOrder,
  type PointsEntry,
  type RewardCode,
} from "./rewards-rules";

// Shopper accounts (Google sign-in) with reward points.
export type Account = {
  id: string;
  email: string;
  name: string;
  picture: string;
  createdAt: string;
  points: number;
  history: PointsEntry[];
  birthday: string; // "MM-DD", set once
  lastBirthdayYear: number;
  reviewBonusUsed: boolean;
  referralCode: string;
  referredBy: string;
  referralRewarded: boolean;
  wishlist: string[];
  stripeCustomerId: string;
  orders: AccountOrder[];
  rewardCodes: RewardCode[];
};

type Accounts = Record<string, Account>;

const MAX_HISTORY = 50;
const MAX_ORDERS = 50;
const MAX_WISHLIST = 100;

function normalise(raw: unknown): Accounts {
  const accounts: Accounts = {};
  if (!raw || typeof raw !== "object") return accounts;
  for (const [id, value] of Object.entries(raw as Record<string, Partial<Account>>)) {
    accounts[id] = {
      id,
      email: value.email ?? "",
      name: value.name ?? "",
      picture: value.picture ?? "",
      createdAt: value.createdAt ?? "",
      points: value.points ?? 0,
      history: value.history ?? [],
      birthday: value.birthday ?? "",
      lastBirthdayYear: value.lastBirthdayYear ?? 0,
      reviewBonusUsed: value.reviewBonusUsed ?? false,
      referralCode: value.referralCode ?? "",
      referredBy: value.referredBy ?? "",
      referralRewarded: value.referralRewarded ?? false,
      wishlist: value.wishlist ?? [],
      stripeCustomerId: value.stripeCustomerId ?? "",
      orders: value.orders ?? [],
      rewardCodes: value.rewardCodes ?? [],
    };
  }
  return accounts;
}

const file = jsonFile<Accounts>({
  blobPathname: "hugostoyz/accounts.json",
  localFile: "accounts.json",
  empty: () => ({}),
  normalise,
});

export async function getAccount(id: string): Promise<Account | null> {
  return (await file.read())[id] ?? null;
}

export async function listAccounts(): Promise<Account[]> {
  return Object.values(await file.read()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Applies a change to one account; returns the updated account.
export async function updateAccount(
  id: string,
  change: (account: Account, all: Accounts) => Account | null
): Promise<Account | null> {
  const result = await file.update<Account | null>((accounts) => {
    const current = accounts[id];
    if (!current) return { data: accounts, result: null };
    const next = change(structuredClone(current), accounts);
    if (!next) return { data: accounts, result: current };
    return { data: { ...accounts, [id]: next }, result: next };
  });
  return result ?? null;
}

function addPoints(account: Account, points: number, reason: string): Account {
  return {
    ...account,
    points: Math.max(0, account.points + points),
    history: [{ at: new Date().toISOString(), points, reason }, ...account.history].slice(0, MAX_HISTORY),
  };
}

function newReferralCode(accounts: Accounts): string {
  const taken = new Set(Object.values(accounts).map((a) => a.referralCode));
  let code = "";
  do {
    code = crypto.randomBytes(4).toString("hex").toUpperCase();
  } while (taken.has(code));
  return code;
}

// Finds or creates the account for a Google sign-in.
export async function signInAccount(profile: {
  id: string;
  email: string;
  name: string;
  picture: string;
  referralCode: string;
}): Promise<Account> {
  const result = await file.update<Account>((accounts) => {
    const existing = accounts[profile.id];
    if (existing) {
      const updated = { ...existing, email: profile.email, name: profile.name, picture: profile.picture };
      return { data: { ...accounts, [profile.id]: updated }, result: updated };
    }
    const referrer = Object.values(accounts).find(
      (a) => profile.referralCode && a.referralCode === profile.referralCode.toUpperCase()
    );
    let account: Account = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      createdAt: new Date().toISOString(),
      points: 0,
      history: [],
      birthday: "",
      lastBirthdayYear: 0,
      reviewBonusUsed: false,
      referralCode: newReferralCode(accounts),
      referredBy: referrer?.id ?? "",
      referralRewarded: false,
      wishlist: [],
      stripeCustomerId: "",
      orders: [],
      rewardCodes: [],
    };
    account = addPoints(account, SIGNUP_POINTS, "Welcome bonus");
    return { data: { ...accounts, [account.id]: account }, result: account };
  });
  return result!;
}

function todayInAustralia(): { year: number; monthDay: string } {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { year: Number(get("year")), monthDay: `${get("month")}-${get("day")}` };
}

// Birthday points: once a year, any time from the birthday to the end of that month.
export async function claimBirthdayPoints(id: string): Promise<Account | null> {
  const { year, monthDay } = todayInAustralia();
  return updateAccount(id, (account) => {
    if (!account.birthday || account.lastBirthdayYear === year) return null;
    const [month] = account.birthday.split("-");
    if (monthDay.slice(0, 2) !== month || monthDay < account.birthday) return null;
    return { ...addPoints(account, BIRTHDAY_POINTS, "Happy birthday! 🎂"), lastBirthdayYear: year };
  });
}

// The first review written while signed in earns points (once only).
export async function claimReviewPoints(id: string): Promise<void> {
  await updateAccount(id, (account) =>
    account.reviewBonusUsed ? null : { ...addPoints(account, REVIEW_POINTS, "Thanks for your review"), reviewBonusUsed: true }
  );
}

// Called by the Stripe webhook once an order is paid. Safe to call twice.
export async function recordOrder(id: string, order: AccountOrder): Promise<void> {
  await file.update((accounts) => {
    const account = accounts[id];
    if (!account || account.orders.some((o) => o.sessionId === order.sessionId)) return { data: accounts };
    let updated: Account = {
      ...addPoints(account, order.pointsEarned, `Order on ${order.date.slice(0, 10)}`),
      orders: [order, ...account.orders].slice(0, MAX_ORDERS),
    };
    const next = { ...accounts };
    const referrer = account.referredBy ? accounts[account.referredBy] : undefined;
    if (referrer && !account.referralRewarded) {
      updated = { ...updated, referralRewarded: true };
      next[referrer.id] = addPoints(referrer, REFERRAL_POINTS, `${account.name.split(" ")[0] || "A friend"} made their first order`);
    }
    next[id] = updated;
    return { data: next };
  });
}

// Takes points away for a reward; returns false if there aren't enough.
export async function spendPoints(id: string, points: number, reason: string): Promise<boolean> {
  const spent = await file.update<boolean>((accounts) => {
    const account = accounts[id];
    if (!account || account.points < points) return { data: accounts, result: false };
    return { data: { ...accounts, [id]: addPoints(account, -points, reason) }, result: true };
  });
  return Boolean(spent);
}

export async function adjustPoints(id: string, points: number, reason: string): Promise<Account | null> {
  return updateAccount(id, (account) => addPoints(account, points, reason));
}

export function cleanWishlist(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.filter((id): id is string => typeof id === "string" && id.length < 100))].slice(0, MAX_WISHLIST);
}

