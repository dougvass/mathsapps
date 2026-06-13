"use client";

import { useEffect, useState } from "react";
import type { Product, ProductCategory } from "@/lib/product-types";

const CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: "fidgets", label: "Fidgets" },
  { value: "shapes", label: "Standard Shapes" },
  { value: "custom", label: "Design Your Own" },
];

export default function AdminPage() {
  const [status, setStatus] = useState<"checking" | "authed" | "unauthed">("checking");
  const [products, setProducts] = useState<Product[]>([]);

  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const response = await fetch("/api/admin/products");
    if (response.ok) {
      setProducts(await response.json());
      setStatus("authed");
    } else {
      setStatus("unauthed");
    }
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError(null);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      setPassword("");
      await loadProducts();
    } else {
      const data = await response.json().catch(() => ({}));
      setLoginError(data.error ?? "Incorrect password.");
    }
    setLoggingIn(false);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setProducts([]);
    setStatus("unauthed");
  }

  function updateProduct(id: string, changes: Partial<Product>) {
    setProducts((prev) =>
      prev.map((product) => (product.id === id ? { ...product, ...changes } : product))
    );
  }

  async function handleSave() {
    setSaveState("saving");
    setSaveError(null);

    const response = await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(products),
    });

    if (response.ok) {
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } else {
      const data = await response.json().catch(() => ({}));
      setSaveError(data.error ?? "Something went wrong while saving.");
      setSaveState("error");
    }
  }

  if (status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-htz-cream">
        <p className="text-htz-navy/60">Loading…</p>
      </main>
    );
  }

  if (status === "unauthed") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-htz-cream px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md"
        >
          <h1 className="font-display text-2xl font-bold text-htz-navy">HugosToyz Admin</h1>
          <p className="mt-1 text-sm text-htz-navy/60">Enter the admin password to continue.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="mt-4 w-full rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none"
            autoFocus
          />
          {loginError && <p className="mt-2 text-sm text-htz-pink">{loginError}</p>}
          <button
            type="submit"
            disabled={loggingIn}
            className="mt-4 w-full rounded-full bg-htz-lime px-6 py-2 font-display font-bold text-htz-navy shadow transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {loggingIn ? "Checking…" : "Log in"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-htz-cream px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-htz-navy sm:text-3xl">
              HugosToyz Admin
            </h1>
            <p className="text-sm text-htz-navy/60">
              Edit product details, then save your changes.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-htz-navy/20 px-4 py-2 text-sm font-semibold text-htz-navy transition-colors hover:bg-htz-navy/5"
          >
            Log out
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {products.map((product) => (
            <div key={product.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-htz-navy">Name</span>
                  <input
                    type="text"
                    value={product.name}
                    onChange={(e) => updateProduct(product.id, { name: e.target.value })}
                    className="rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-htz-navy">Category</span>
                  <select
                    value={product.category}
                    onChange={(e) =>
                      updateProduct(product.id, {
                        category: e.target.value as ProductCategory,
                      })
                    }
                    className="rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-htz-navy">Price (AUD)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.price}
                    onChange={(e) =>
                      updateProduct(product.id, { price: Number(e.target.value) })
                    }
                    className="rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-htz-navy">
                    Image URL <span className="text-htz-navy/50">(blank = placeholder icon)</span>
                  </span>
                  <input
                    type="text"
                    value={product.image}
                    onChange={(e) => updateProduct(product.id, { image: e.target.value })}
                    placeholder="https://…"
                    className="rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none"
                  />
                </label>

                <label className="sm:col-span-2 flex flex-col gap-1">
                  <span className="text-sm font-semibold text-htz-navy">Description</span>
                  <textarea
                    value={product.description}
                    onChange={(e) =>
                      updateProduct(product.id, { description: e.target.value })
                    }
                    rows={2}
                    className="rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none"
                  />
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={product.active}
                    onChange={(e) => updateProduct(product.id, { active: e.target.checked })}
                    className="h-5 w-5 accent-htz-orange"
                  />
                  <span className="text-sm font-semibold text-htz-navy">
                    Active (visible in store)
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-4 mt-6 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-lg">
          <button
            type="button"
            onClick={handleSave}
            disabled={saveState === "saving"}
            className="rounded-full bg-htz-lime px-6 py-2 font-display font-bold text-htz-navy shadow transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {saveState === "saving" ? "Saving…" : "Save Changes"}
          </button>
          {saveState === "saved" && (
            <span className="text-sm font-semibold text-green-600">Saved!</span>
          )}
          {saveState === "error" && (
            <span className="text-sm font-semibold text-htz-pink">{saveError}</span>
          )}
        </div>
      </div>
    </main>
  );
}
