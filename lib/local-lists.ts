"use client";

import { useCallback, useSyncExternalStore } from "react";

// Small lists of product ids kept in the shopper's browser (wishlist, recently
// viewed). Shared across components on the page and across browser tabs.

const EMPTY: string[] = [];
const cache = new Map<string, string[]>();
const listeners = new Map<string, Set<() => void>>();

function read(key: string): string[] {
  if (!cache.has(key)) {
    let value = EMPTY;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
      if (Array.isArray(parsed)) value = parsed.filter((id) => typeof id === "string");
    } catch {}
    cache.set(key, value);
  }
  return cache.get(key)!;
}

function write(key: string, value: string[]) {
  cache.set(key, value);
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  listeners.get(key)?.forEach((listener) => listener());
}

function subscribe(key: string, listener: () => void) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === key) {
      cache.delete(key);
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.get(key)?.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function useList(key: string): string[] {
  return useSyncExternalStore(
    useCallback((listener) => subscribe(key, listener), [key]),
    () => read(key),
    () => EMPTY
  );
}

const WISHLIST_KEY = "htz-wishlist";
const RECENT_KEY = "htz-recently-viewed";
const MAX_RECENT = 12;

// When signed in, wishlist changes are also saved to the shopper's account.
let wishlistSaver: ((ids: string[]) => void) | null = null;

export function setWishlistSaver(saver: ((ids: string[]) => void) | null) {
  wishlistSaver = saver;
}

// Combines this device's wishlist with the account's; returns the result.
export function mergeWishlist(accountIds: string[]): string[] {
  const current = read(WISHLIST_KEY);
  const merged = [...current, ...accountIds.filter((id) => !current.includes(id))];
  if (merged.length !== current.length) write(WISHLIST_KEY, merged);
  return merged;
}

export function useWishlist() {
  const ids = useList(WISHLIST_KEY);
  const toggle = useCallback((id: string) => {
    const current = read(WISHLIST_KEY);
    const next = current.includes(id) ? current.filter((x) => x !== id) : [id, ...current];
    write(WISHLIST_KEY, next);
    wishlistSaver?.(next);
  }, []);
  return { ids, has: (id: string) => ids.includes(id), toggle };
}

export function useRecentlyViewed() {
  const ids = useList(RECENT_KEY);
  const record = useCallback((id: string) => {
    const current = read(RECENT_KEY);
    if (current[0] === id) return;
    write(RECENT_KEY, [id, ...current.filter((x) => x !== id)].slice(0, MAX_RECENT));
  }, []);
  return { ids, record };
}

const COMPARE_KEY = "htz-compare";
export const MAX_COMPARE = 3;

// Up to 3 toys picked to see side by side.
export function useCompare() {
  const ids = useList(COMPARE_KEY);
  const toggle = useCallback((id: string) => {
    const current = read(COMPARE_KEY);
    if (current.includes(id)) write(COMPARE_KEY, current.filter((x) => x !== id));
    else write(COMPARE_KEY, [...current, id].slice(-MAX_COMPARE));
  }, []);
  const clear = useCallback(() => write(COMPARE_KEY, []), []);
  return { ids, has: (id: string) => ids.includes(id), toggle, clear };
}
