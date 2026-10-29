import { NextResponse } from "next/server";
import { claimBirthdayPoints, cleanWishlist, getAccount, updateAccount } from "@/lib/accounts";
import { accountView, ensureStripeCustomer, stripeClient } from "@/lib/account-view";
import { currentAccountId } from "@/lib/user-session";
import type { Address } from "@/lib/rewards-rules";
import { hashPassword, verifyPasswordHash } from "@/lib/auth";
import { passwordProblem } from "@/lib/password-rules";
import { setPasswordHash } from "@/lib/accounts";

export const dynamic = "force-dynamic";

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function validBirthday(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{2}-\d{2}$/.test(value)) return false;
  const [month, day] = value.split("-").map(Number);
  return month >= 1 && month <= 12 && day >= 1 && day <= DAYS_IN_MONTH[month - 1];
}

function cleanAddress(raw: unknown): Address | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const field = (key: string, max = 100) => (typeof value[key] === "string" ? (value[key] as string).trim().slice(0, max) : "");
  const address = {
    name: field("name"),
    line1: field("line1"),
    line2: field("line2"),
    city: field("city", 60),
    state: field("state", 20),
    postcode: field("postcode", 10),
  };
  if (!address.name || !address.line1 || !address.city || !address.state || !/^\d{4}$/.test(address.postcode)) return null;
  return address;
}

// The signed-in shopper's account, or { account: null }.
export async function GET() {
  const id = await currentAccountId();
  if (!id) return NextResponse.json({ account: null });
  try {
    const account = (await claimBirthdayPoints(id)) ?? (await getAccount(id));
    if (!account) return NextResponse.json({ account: null });
    return NextResponse.json({ account: await accountView(account) });
  } catch (error) {
    console.error("Loading account failed:", error);
    return NextResponse.json({ error: "Couldn't load your account." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const id = await currentAccountId();
  if (!id) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  let body: { birthday?: unknown; wishlist?: unknown; address?: unknown; currentPassword?: unknown; newPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.newPassword !== undefined) {
    const current = await getAccount(id);
    if (!current?.passwordHash) return NextResponse.json({ error: "This account doesn't use a password." }, { status: 400 });
    if (typeof body.currentPassword !== "string" || !verifyPasswordHash(body.currentPassword, current.passwordHash)) {
      return NextResponse.json({ error: "Your current password isn't right." }, { status: 400 });
    }
    const problem = passwordProblem(body.newPassword);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    await setPasswordHash(id, hashPassword(body.newPassword as string));
    return NextResponse.json({ ok: true });
  }

  if (body.birthday !== undefined && !validBirthday(body.birthday)) {
    return NextResponse.json({ error: "Please choose a valid birthday." }, { status: 400 });
  }
  const address = body.address !== undefined ? cleanAddress(body.address) : undefined;
  if (address === null) {
    return NextResponse.json({ error: "Please fill in the name, street, suburb, state and 4-digit postcode." }, { status: 400 });
  }

  const account = await updateAccount(id, (a) => ({
    ...a,
    // Birthdays can only be set once, so nobody changes it to collect extra points.
    ...(body.birthday !== undefined && !a.birthday ? { birthday: body.birthday as string } : {}),
    ...(body.wishlist !== undefined ? { wishlist: cleanWishlist(body.wishlist) } : {}),
  }));
  if (!account) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  if (address) {
    const stripe = stripeClient();
    if (!stripe) return NextResponse.json({ error: "Saving addresses isn't set up yet." }, { status: 500 });
    const customerId = await ensureStripeCustomer(stripe, account);
    await stripe.customers.update(customerId, {
      shipping: {
        name: address.name,
        address: {
          line1: address.line1,
          line2: address.line2 || undefined,
          city: address.city,
          state: address.state,
          postal_code: address.postcode,
          country: "AU",
        },
      },
    });
  }

  return NextResponse.json({ ok: true });
}
