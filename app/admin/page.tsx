"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BADGE_LABELS,
  MAX_GALLERY_PHOTOS,
  type BannerSettings,
  type CategoryDef,
  type Faq,
  type HomeText,
  type Product,
  type ProductBadge,
  type SizeOption,
  type SocialLinks,
  type StoreSettings,
} from "@/lib/product-types";
import { DEFAULT_FAQS } from "@/lib/default-faqs";
import ImageDropzone from "@/components/ImageDropzone";
import DiscountCodes from "@/components/DiscountCodes";
import QrCodeCard from "@/components/QrCodeCard";
import StockEditor from "@/components/StockEditor";
import OrdersPanel from "@/components/OrdersPanel";
import ProductImage from "@/components/ProductImage";
import {
  FaqEditor,
  HeroPhotoSection,
  HomeTextEditor,
  ReviewsModerator,
  RewardsMembers,
  SocialLinksEditor,
} from "@/components/AdminSiteSections";

export default function AdminPage() {
  const [status, setStatus] = useState<"checking" | "authed" | "unauthed">("checking");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizeOptions, setSizeOptions] = useState<SizeOption[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({ printerMaxBuildMm: 220 });
  const [banner, setBanner] = useState<BannerSettings>({
    enabled: false,
    image: "",
    headline: "",
    subtext: "",
  });
  const [heroImage, setHeroImage] = useState("");
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: "",
    tiktok: "",
    facebook: "",
    youtube: "",
  });

  const [homeText, setHomeText] = useState<HomeText>({
    heroHeadline: "",
    heroHighlight: "",
    heroIntro: "",
    aboutTitle: "",
    aboutText: "",
  });
  // Version of the shop data this page was loaded at; saving checks it.
  const [version, setVersion] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [productFilter, setProductFilter] = useState("");

  const editable = { products, categories, colors, sizeOptions, settings, banner, heroImage, faqs, socialLinks, homeText };
  const snapshot = JSON.stringify(editable);
  const dirty = status === "authed" && savedSnapshot !== "" && snapshot !== savedSnapshot;

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const visibleProducts = useMemo(() => {
    const terms = productFilter.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return products;
    return products.filter((product) => {
      const text = `${product.name} ${product.description} ${product.category}`.toLowerCase();
      return terms.every((term) => text.includes(term));
    });
  }, [products, productFilter]);

  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error" | "conflict">("idle");
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
      setBanner(data.banner);
      setHeroImage(data.heroImage);
      setFaqs(data.faqs);
      setSocialLinks(data.socialLinks);
      setHomeText(data.homeText);
      setVersion(data.version);
      setSavedSnapshot(
        JSON.stringify({
          products: data.products,
          categories: data.categories,
          colors: data.colors,
          sizeOptions: data.sizeOptions,
          settings: data.settings,
          banner: data.banner,
          heroImage: data.heroImage,
          faqs: data.faqs,
          socialLinks: data.socialLinks,
          homeText: data.homeText,
        })
      );
      setSaveState("idle");
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
      chooseColor: false,
      needsCustomText: false,
      gallery: [],
      badge: "",
      stock: "made-to-order",
    };
    setProducts((prev) => [...prev, newProduct]);
    openAndScrollTo(newProduct.id);
  }

  function openAndScrollTo(id: string) {
    setProductFilter("");
    setExpanded((prev) => new Set(prev).add(id));
    setTimeout(() => {
      document.getElementById(`admin-product-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function moveProduct(id: string, delta: number) {
    setProducts((prev) => {
      const index = prev.findIndex((product) => product.id === id);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function duplicateProduct(id: string) {
    const original = products.find((product) => product.id === id);
    if (!original) return;
    const copy: Product = {
      ...original,
      id: `product-${Date.now()}`,
      name: `${original.name} (copy)`,
      active: false,
    };
    setProducts((prev) => {
      const index = prev.findIndex((product) => product.id === id);
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
    });
    openAndScrollTo(copy.id);
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
      body: JSON.stringify({
        products,
        categories,
        colors,
        sizeOptions,
        settings,
        banner,
        heroImage,
        faqs,
        socialLinks,
        homeText,
        version,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setVersion(data.version);
      setSavedSnapshot(snapshot);
      setSaveState("saved");
      setTimeout(() => setSaveState((state) => (state === "saved" ? "idle" : state)), 2000);
    } else {
      setSaveError(data.error ?? "Something went wrong while saving.");
      setSaveState(data.conflict ? "conflict" : "error");
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
    <main className="min-h-screen bg-htz-cream px-4 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          onClick={(event) => {
            if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) {
              event.preventDefault();
            }
          }}
          className="mb-4 inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-htz-navy shadow transition-transform hover:scale-105 active:scale-95"
        >
          ← Back to Store
        </Link>
        <div className="mb-6 flex items-center justify-between gap-3">
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
              className="whitespace-nowrap rounded-full bg-htz-orange px-4 py-2 text-sm font-bold text-white shadow transition-transform hover:scale-105 active:scale-95"
            >
              + Add Product
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="whitespace-nowrap rounded-full border border-htz-navy/20 px-4 py-2 text-sm font-semibold text-htz-navy transition-colors hover:bg-htz-navy/5"
            >
              Log out
            </button>
          </div>
        </div>

        <OrdersPanel />

        <div className="mt-6 flex flex-col gap-4">
          <HeroPhotoSection heroImage={heroImage} onChange={setHeroImage} />
          <HomeTextEditor text={homeText} onChange={setHomeText} />

          {/* Sale banner */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-htz-navy">Sale Banner</h2>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={banner.enabled}
                  onChange={(e) => setBanner({ ...banner, enabled: e.target.checked })}
                  className="h-5 w-5 accent-htz-orange"
                />
                <span className="text-sm font-semibold text-htz-navy">Show on the shop</span>
              </label>
            </div>
            <p className="mb-3 text-sm text-htz-navy/60">
              Appears under the welcome section. Upload a banner image (a wide image works
              best, around 3:1), or leave it empty to show the text below on a coloured strip.
            </p>
            <ImageDropzone
              value={banner.image}
              onChange={(url) => setBanner({ ...banner, image: url })}
              maxDimension={2400}
              aspectClass="aspect-[3/1]"
              emptyLabel="Drop a banner image here, or click to choose"
            />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-htz-navy">Headline</span>
                <input
                  type="text"
                  value={banner.headline}
                  onChange={(e) => setBanner({ ...banner, headline: e.target.value })}
                  placeholder="Sale Now On"
                  className="rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-htz-navy">Subtext</span>
                <input
                  type="text"
                  value={banner.subtext}
                  onChange={(e) => setBanner({ ...banner, subtext: e.target.value })}
                  placeholder="Bonus on your first order"
                  className="rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none"
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-htz-navy/50">
              With an image, the headline is used as its description for screen readers.
            </p>
          </div>

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
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-htz-navy">
                Products <span className="text-sm font-normal text-htz-navy/60">({products.length})</span>
              </h2>
              <p className="text-sm text-htz-navy/60">
                Tap a product to edit it. ↑ ↓ change the order they appear in the shop.
              </p>
            </div>
            <input
              type="search"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              placeholder="Find a product…"
              aria-label="Find a product"
              className="w-full rounded-full border border-htz-navy/20 bg-white px-4 py-2 text-sm focus:border-htz-orange focus:outline-none sm:w-60"
            />
          </div>
          {visibleProducts.length === 0 && (
            <p className="text-sm text-htz-navy/60">No products match “{productFilter}”.</p>
          )}
          {visibleProducts.map((product) => {
            const index = products.findIndex((p) => p.id === product.id);
            const open = expanded.has(product.id);
            const categoryLabel = categories.find((c) => c.value === product.category)?.label ?? "No category";
            const stockSummary =
              typeof product.stock === "number"
                ? `${product.stock} in stock`
                : product.stock === "made-to-order"
                  ? "Made to order"
                  : "Out of stock";
            const lowStock = typeof product.stock === "number" && product.stock <= 2;
            return (
            <div
              key={product.id}
              id={`admin-product-${product.id}`}
              className={`scroll-mt-4 rounded-2xl bg-white shadow-sm ${open ? "ring-2 ring-htz-orange/40" : ""}`}
            >
              <div className="flex items-center gap-2 p-3">
                <button
                  type="button"
                  onClick={() => toggleExpanded(product.id)}
                  aria-expanded={open}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                    <ProductImage product={product} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-htz-navy">
                      {product.name || "Untitled product"}
                    </span>
                    <span className="block truncate text-xs text-htz-navy/60">
                      {categoryLabel} · ${product.price.toFixed(2)} · {stockSummary}
                    </span>
                  </span>
                  <span className="hidden shrink-0 gap-1 sm:flex">
                    {!product.active && (
                      <span className="rounded-full bg-htz-navy/10 px-2 py-0.5 text-xs font-semibold text-htz-navy/70">Hidden</span>
                    )}
                    {lowStock && (
                      <span className="rounded-full bg-htz-orange/15 px-2 py-0.5 text-xs font-semibold text-htz-orange">Low stock</span>
                    )}
                    {product.stock === "out-of-stock" && (
                      <span className="rounded-full bg-htz-pink/10 px-2 py-0.5 text-xs font-semibold text-htz-pink">Out of stock</span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-htz-navy/50" aria-hidden="true">{open ? "▲" : "▼"}</span>
                </button>
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => moveProduct(product.id, -1)}
                    disabled={index === 0 || productFilter !== ""}
                    aria-label={`Move ${product.name} up`}
                    className="rounded px-2 text-htz-navy/60 hover:bg-htz-navy/5 disabled:opacity-20"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveProduct(product.id, 1)}
                    disabled={index === products.length - 1 || productFilter !== ""}
                    aria-label={`Move ${product.name} down`}
                    className="rounded px-2 text-htz-navy/60 hover:bg-htz-navy/5 disabled:opacity-20"
                  >
                    ↓
                  </button>
                </div>
              </div>
              {open && (
              <div className="border-t border-htz-navy/10 p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-xs text-htz-navy/40">{product.id}</span>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => duplicateProduct(product.id)}
                    className="text-xs font-semibold text-htz-navy hover:underline"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    className="text-xs font-semibold text-htz-pink hover:underline"
                  >
                    Remove
                  </button>
                </div>
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

                <StockEditor
                  stock={product.stock}
                  onChange={(stock) => updateProduct(product.id, { stock })}
                />

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-htz-navy">Badge</span>
                  <select
                    value={product.badge}
                    onChange={(e) =>
                      updateProduct(product.id, { badge: e.target.value as ProductBadge })
                    }
                    className="rounded-lg border border-htz-navy/20 px-3 py-2 focus:border-htz-orange focus:outline-none"
                  >
                    <option value="">None</option>
                    {Object.entries(BADGE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-sm font-semibold text-htz-navy">
                    Photos{" "}
                    <span className="font-normal text-htz-navy/50">
                      (first = main photo; up to {MAX_GALLERY_PHOTOS} extra)
                    </span>
                  </span>
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="w-32">
                      <ImageDropzone
                        value={product.image}
                        onChange={(url) => updateProduct(product.id, { image: url })}
                        maxDimension={1200}
                        emptyLabel="Main photo"
                      />
                    </div>
                    {product.gallery.map((photo, index) => (
                      <div key={photo} className="w-28">
                        <ImageDropzone
                          value={photo}
                          onChange={(url) =>
                            updateProduct(product.id, {
                              gallery: url
                                ? product.gallery.map((p, i) => (i === index ? url : p))
                                : product.gallery.filter((_, i) => i !== index),
                            })
                          }
                          maxDimension={1200}
                        />
                      </div>
                    ))}
                    {product.image && product.gallery.length < MAX_GALLERY_PHOTOS && (
                      <div className="w-28">
                        <ImageDropzone
                          value=""
                          onChange={(url) =>
                            url && updateProduct(product.id, { gallery: [...product.gallery, url] })
                          }
                          maxDimension={1200}
                          emptyLabel="+ Add photo"
                        />
                      </div>
                    )}
                  </div>
                </div>

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

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={product.chooseColor}
                    onChange={(e) => updateProduct(product.id, { chooseColor: e.target.checked })}
                    className="h-5 w-5 accent-htz-orange"
                  />
                  <span className="text-sm font-semibold text-htz-navy">
                    Customer picks a colour
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={product.needsCustomText}
                    onChange={(e) =>
                      updateProduct(product.id, { needsCustomText: e.target.checked })
                    }
                    className="h-5 w-5 accent-htz-orange"
                  />
                  <span className="text-sm font-semibold text-htz-navy">
                    Customer types text to print (e.g. a name)
                  </span>
                </label>

                <a
                  href={`/products/${product.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-center text-sm font-semibold text-htz-orange hover:underline"
                >
                  View product page ↗
                </a>
              </div>
              </div>
              )}
            </div>
            );
          })}

          <FaqEditor faqs={faqs} defaults={DEFAULT_FAQS} onChange={setFaqs} />
          <SocialLinksEditor links={socialLinks} onChange={setSocialLinks} />
        </div>

        <DiscountCodes />

        <ReviewsModerator products={products} />

        <RewardsMembers />

        <QrCodeCard />

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

        {/* Last thing on the page, and sticks to the bottom of the screen all the way down. */}
        <div className="sticky bottom-0 z-30 -mx-4 mt-8 border-t sm:-mx-6 lg:-mx-8 border-htz-navy/10 bg-white/95 shadow-[0_-4px_16px_rgba(11,43,58,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
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
          {saveState === "conflict" && (
            <span className="text-sm font-semibold text-htz-pink">
              {saveError}{" "}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="underline"
              >
                Reload now
              </button>
            </span>
          )}
          {saveState === "idle" && dirty && (
            <span className="text-sm font-semibold text-htz-orange">● Unsaved changes</span>
          )}
          {saveState === "idle" && !dirty && (
            <span className="text-xs text-htz-navy/50">
              New photos and banner changes go live when you save.
            </span>
          )}
          </div>
        </div>
      </div>
    </main>
  );
}
