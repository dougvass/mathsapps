"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { stockLimit, type Product } from "@/lib/product-types";

// What makes one cart line different from another of the same product.
export type LineKey = {
  productId: string;
  color: string;
  size: string;
  customText: string;
};

export type CartItem = LineKey & { quantity: number };

export type CartLine = CartItem & { product: Product };

type CartContextValue = {
  items: CartItem[];
  lines: CartLine[];
  totalItems: number;
  totalPrice: number;
  // Most recent add, for the "Added to cart" pop-up.
  lastAdded: { key: LineKey; quantity: number; at: number } | null;
  dismissAdded: () => void;
  // Returns how many were actually added (limited by stock).
  addItem: (key: LineKey, quantity?: number) => number;
  removeItem: (key: LineKey) => void;
  setQuantity: (key: LineKey, quantity: number) => void;
  canAddMore: (productId: string) => boolean;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "htz-cart-v2";

export function lineId(key: LineKey): string {
  return [key.productId, key.color, key.size, key.customText].join("::");
}

function sameLine(a: LineKey, b: LineKey): boolean {
  return lineId(a) === lineId(b);
}

// Stock is per product, so every colour/size/text line of it shares the limit.
function remainingStock(
  items: CartItem[],
  products: Product[],
  productId: string,
  excludeLine?: LineKey
): number {
  const product = products.find((p) => p.id === productId);
  if (!product) return 0;
  const inCart = items
    .filter((item) => item.productId === productId && !(excludeLine && sameLine(item, excludeLine)))
    .reduce((sum, item) => sum + item.quantity, 0);
  return stockLimit(product.stock) - inCart;
}

// Cart items are stored outside React state and synced via
// useSyncExternalStore, so the cart persists across reloads without
// triggering setState-in-effect cascades during hydration.
const EMPTY_CART: CartItem[] = [];
let cartItems: CartItem[] = EMPTY_CART;
let hasLoadedFromStorage = false;
const listeners = new Set<() => void>();

function loadFromStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_CART;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_CART;
    // Carts saved before custom text existed don't have the field.
    return parsed.map((item) => ({ ...item, customText: item.customText ?? "" }));
  } catch {
    return EMPTY_CART;
  }
}

function getSnapshot(): CartItem[] {
  if (!hasLoadedFromStorage) {
    cartItems = loadFromStorage();
    hasLoadedFromStorage = true;
  }
  return cartItems;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY_CART;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Used after a successful payment, where the cart provider isn't mounted.
export function clearSavedCart(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
  cartItems = EMPTY_CART;
  hasLoadedFromStorage = true;
  listeners.forEach((listener) => listener());
}

function setCartItems(updater: (prev: CartItem[]) => CartItem[]): void {
  cartItems = updater(cartItems);
  hasLoadedFromStorage = true;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  listeners.forEach((listener) => listener());
}

export function CartProvider({
  products,
  children,
}: {
  products: Product[];
  children: React.ReactNode;
}) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [lastAdded, setLastAdded] = useState<CartContextValue["lastAdded"]>(null);

  const addItem = useCallback(
    (key: LineKey, quantity = 1) => {
      const allowed = Math.min(quantity, remainingStock(getSnapshot(), products, key.productId));
      if (allowed < 1) return 0;
      setCartItems((prev) => {
        const existing = prev.find((item) => sameLine(item, key));
        if (existing) {
          return prev.map((item) =>
            sameLine(item, key) ? { ...item, quantity: item.quantity + allowed } : item
          );
        }
        return [...prev, { ...key, quantity: allowed }];
      });
      setLastAdded({ key, quantity: allowed, at: Date.now() });
      return allowed;
    },
    [products]
  );

  const removeItem = useCallback((key: LineKey) => {
    setCartItems((prev) => prev.filter((item) => !sameLine(item, key)));
  }, []);

  const setQuantity = useCallback(
    (key: LineKey, quantity: number) => {
      setCartItems((prev) => {
        if (quantity <= 0) {
          return prev.filter((item) => !sameLine(item, key));
        }
        const allowed = Math.min(quantity, remainingStock(prev, products, key.productId, key));
        if (allowed <= 0) return prev;
        return prev.map((item) => (sameLine(item, key) ? { ...item, quantity: allowed } : item));
      });
    },
    [products]
  );

  const canAddMore = useCallback(
    (productId: string) => remainingStock(items, products, productId) >= 1,
    [items, products]
  );

  const clearCart = useCallback(() => setCartItems(() => []), []);
  const dismissAdded = useCallback(() => setLastAdded(null), []);

  const lines = useMemo<CartLine[]>(() => {
    return items
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        return { ...item, product };
      })
      .filter((line): line is CartLine => line !== null);
  }, [items, products]);

  const totalItems = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines]
  );

  const totalPrice = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity * line.product.price, 0),
    [lines]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      lines,
      totalItems,
      totalPrice,
      lastAdded,
      dismissAdded,
      addItem,
      removeItem,
      setQuantity,
      canAddMore,
      clearCart,
    }),
    [items, lines, totalItems, totalPrice, lastAdded, dismissAdded, addItem, removeItem, setQuantity, canAddMore, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
