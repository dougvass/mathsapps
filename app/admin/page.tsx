"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CategoryDef, Product, SizeOption, StoreSettings } from "@/lib/product-types";

export default function AdminPage() {
  const [status, setStatus] = useState<"checking" | "authed" | "unauthed">("checking");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizeOptions, setSizeOptions] = useState<SizeOption[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({ printerMaxBuildMm: 220 });

  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordState, setPasswordState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    loadStore();
  }, []);

  async function loadStore() {
    const response = await fetch("/api/admin/store");
    if (response.ok) {
      const data = await response.json();
      setProducts(data.products);
      setCategories(data.categories);
      setColors(data.colors);
      setSizeOptions(data.sizeOptions);
      setSettings(data.settings);
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
      await loadStore();
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

  function addProduct() {
    const newProduct: Product = {
      id: `product-${Date.now()}`,
      name: "New Product",
      category: categories[0]?.value ?? "",
      price: 0,
      description: "",
      emoji: "✨",
      image: "",
      active: false,
    };
    setProducts((prev) => [...prev, newProduct]);
  }

  function removeProduct(id: string) {
    if (!window.confirm("Remove this product? This can't be undone once you save.")) {
      return;
    }
    setProducts((prev) => prev.filter((product) => product.id !== id));
  }

  function addCategory() {
    setCategories((prev) => [...prev, { value: `category-${Date.now()}`, label: "New Category" }]);
  }

  function updateCategory(index: number, changes: Partial<CategoryDef>) {
    setCategories((prev) => prev.map((category, i) => (i === index ? { ...category, ...changes } : category)));
  }

  function removeCategory(index: number) {
    if (!window.confirm("Remove this category? Products using it will need a new category.")) {
      return;
    }
    setCategories((prev) => prev.filter((_, i) => i !== index));
  }

  function addColor() {
    setColors((prev) => [...prev, "New Colour"]);
  }

  function updateColor(index: number, value: string) {
    setColors((prev) => prev.map((color, i) => (i === index ? value : color)));
  }

  function removeColor(index: number) {
    setColors((prev) => prev.filter((_, i) => i !== index));
  }

  function addSizeOption() {
    setSizeOptions((prev) => [...prev, { label: "New Size", maxDimensionMm: settings.printerMaxBuildMm }]);
  }

  function updateSizeOption(index: number, changes: Partial<SizeOption>) {
    setSizeOptions((prev) => prev.map((size, i) => (i === index ? { ...size, ...changes } : size)));
  }

  function removeSizeOption(index: number) {
    setSizeOptions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaveState("saving");
    setSaveError(null);

    const response = await fetch("/api/admin/store", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products, categories, colors, sizeOptions, settings }),
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

  async function handleChangePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match.");
      setPasswordState("error");
      return;
    }

    setPasswordState("saving");

    const response = await fetch("/api/admin/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (response.ok) {
      setPasswordState("saved");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordState("idle"), 2000);
    } else {
      const data = await response.json().catch(() => ({}));
      setPasswordError(data.error ?? "Something went wrong.");
      setPasswordState("error");
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
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-htz-navy shadow transition-transform hover:scale-105 active:scale-95"
          >
            ← Back to Store
          </Link>
          <form
            onSubmit={handleLogin}
            className="w-full rounded-2xl bg-white p-8 shadow-md"
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
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-htz-cream px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-htz-navy shadow transition-transform hover:scale-105 active:scale-95"
        >
          ← Back to Store
        </Link>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-htz-navy sm:text-3xl">
              HugosToyz Admin
            </h1>
            <p className="text-sm text-htz-navy/60">
              Edit product details, then save your changes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addProduct}
              className="rounded-full bg-htz-orange px-4 py-2 text-sm font-bold text-white shadow transition-transform hover:scale-105 active:scale-95"
            >
              + Add Product
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-htz-navy/20 px-4 py-2 text-sm font-semibold text-htz-navy transition-colors hover:bg-htz-navy/5"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Categories */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-htz-navy">Categories</h2>
              <button
                type="button"
                onClick={addCategory}
                className="rounded-full bg-htz-orange px-3 py-1 text-xs font-bold text-white shadow transition-transform hover:scale-105 active:scale-95"
              >
                + Add Category
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {categories.map((category, index) => (
                <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-htz-navy/70">Label (shown to customers)</span>
                    <input
                      type="text"
                      value={category.label}
                      onChange={(e) => updateCategory(index, { label: e.target.value })}
                      className="rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-htz-navy/70">Internal ID</span>
                    <input
                      type="text"
                      value={category.value}
                      onChange={(e) => updateCategory(index, { value: e.target.value })}
                      className="rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeCategory(index)}
                    className="text-xs font-semibold text-htz-pink hover:underline sm:pb-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Colours */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-htz-navy">Available Colours</h2>
              <button
                type="button"
                onClick={addColor}
                className="rounded-full bg-htz-orange px-3 py-1 text-xs font-bold text-white shadow transition-transform hover:scale-105 active:scale-95"
              >
                + Add Colour
              </button>
            </div>
            <p className="mb-3 text-sm text-htz-navy/60">
              Customers choose one of these before adding an item to their cart.
            </p>
            <div className="flex flex-wrap gap-2">
              {colors.map((color, index) => (
                <div key={index} className="flex items-center gap-1 rounded-full border border-htz-navy/20 pl-3 pr-2 py-1">
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => updateColor(index, e.target.value)}
                    className="w-28 bg-transparent text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeColor(index)}
                    className="text-htz-pink"
                    aria-label={`Remove ${color}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sizes & printer limits */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-htz-navy">Sizes &amp; Printer Limits</h2>
              <button
                type="button"
                onClick={addSizeOption}
                className="rounded-full bg-htz-orange px-3 py-1 text-xs font-bold text-white shadow transition-transform hover:scale-105 active:scale-95"
              >
                + Add Size
              </button>
            </div>
            <label className="mb-4 flex max-w-xs flex-col gap-1">
              <span className="text-sm font-semibold text-htz-navy">Printer max build size (mm)</span>
              <input
                type="number"
                min="1"
                step="1"
                value={settings.printerMaxBuildMm}
                onChange={(e) => setSettings({ printerMaxBuildMm: Number(e.target.value) })}
                className="rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none"
              />
              <span className="text-xs text-htz-navy/50">
                Flashforge AD5M = 220mm. Size options below can&apos;t exceed this.
              </span>
            </label>
            <div className="flex flex-col gap-3">
              {sizeOptions.map((size, index) => (
                <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-htz-navy/70">Label (shown to customers)</span>
                    <input
                      type="text"
                      value={size.label}
                      onChange={(e) => updateSizeOption(index, { label: e.target.value })}
                      className="rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-htz-navy/70">Max dimension (mm)</span>
                    <input
                      type="number"
                      min="1"
                      max={settings.printerMaxBuildMm}
                      step="1"
                      value={size.maxDimensionMm}
                      onChange={(e) => updateSizeOption(index, { maxDimensionMm: Number(e.target.value) })}
                      className="rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeSizeOption(index)}
                    className="text-xs font-semibold text-htz-pink hover:underline sm:pb-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Products */}
          {products.map((product) => (
            <div key={product.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-xs text-htz-navy/40">{product.id}</span>
                <button
                  type="button"
                  onClick={() => removeProduct(product.id)}
                  className="text-xs font-semibold text-htz-pink hover:underline"
                >
                  Remove
                </button>
              </div>
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
                        category: e.target.value,
                      })
                    }
                    className="rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none"
                  >
                    {categories.map((option) => (
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

        {/* Change password */}
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-bold text-htz-navy">Change Admin Password</h2>
          <form onSubmit={handleChangePassword} className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-htz-navy">Current Password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-htz-navy">New Password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-htz-navy">Confirm New Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none"
              />
            </label>
            <div className="flex items-center gap-4 sm:col-span-3">
              <button
                type="submit"
                disabled={passwordState === "saving"}
                className="rounded-full bg-htz-lime px-6 py-2 font-display font-bold text-htz-navy shadow transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {passwordState === "saving" ? "Saving…" : "Update Password"}
              </button>
              {passwordState === "saved" && (
                <span className="text-sm font-semibold text-green-600">Updated!</span>
              )}
              {passwordError && <span className="text-sm font-semibold text-htz-pink">{passwordError}</span>}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
