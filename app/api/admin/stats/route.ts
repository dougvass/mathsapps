import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getSoldCounts } from "@/lib/products";
import { listAccounts } from "@/lib/accounts";

export const dynamic = "force-dynamic";

// Sold counts and how many signed-in shoppers are waiting for each toy.
export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [soldCounts, accounts] = await Promise.all([getSoldCounts(), listAccounts()]);
  const waiting: Record<string, number> = {};
  for (const account of accounts) {
    for (const id of account.stockAlerts) waiting[id] = (waiting[id] ?? 0) + 1;
  }
  return NextResponse.json({ soldCounts, waiting });
}
