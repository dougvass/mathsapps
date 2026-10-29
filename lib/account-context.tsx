"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AccountView } from "./rewards-rules";
import { mergeWishlist, setWishlistSaver } from "./local-lists";

type AccountContextValue = {
  account: AccountView | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);

function saveWishlist(ids: string[]) {
  fetch("/api/account", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wishlist: ids }),
  }).catch(() => {});
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<AccountView | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/account", { cache: "no-store" });
      const data = await response.json();
      setAccount(data.account ?? null);
    } catch {
      setAccount(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  // Signed in: wishlist follows the shopper to any device.
  useEffect(() => {
    if (!account) {
      setWishlistSaver(null);
      return;
    }
    const merged = mergeWishlist(account.wishlist);
    if (merged.length !== account.wishlist.length || merged.some((id) => !account.wishlist.includes(id))) {
      saveWishlist(merged);
    }
    setWishlistSaver(saveWishlist);
    return () => setWishlistSaver(null);
  }, [account]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setAccount(null);
  }, []);

  return (
    <AccountContext.Provider value={{ account, loading, refresh, signOut }}>{children}</AccountContext.Provider>
  );
}

export function useAccount(): AccountContextValue {
  const value = useContext(AccountContext);
  if (!value) throw new Error("useAccount must be used within an AccountProvider");
  return value;
}
