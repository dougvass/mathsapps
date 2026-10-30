"use client";

export const ADMIN_TABS = [
  { id: "products", label: "Products", icon: "📦" },
  { id: "orders", label: "Orders", icon: "🧾" },
  { id: "home", label: "Homepage", icon: "🏠" },
  { id: "deals", label: "Deals", icon: "💸" },
  { id: "people", label: "Reviews & Members", icon: "⭐" },
  { id: "setup", label: "Setup", icon: "⚙️" },
] as const;

export type AdminTabId = (typeof ADMIN_TABS)[number]["id"];

// Big, iPad-friendly tabs along the top of the admin page.
export function AdminTabBar({ current, onChange }: { current: AdminTabId; onChange: (tab: AdminTabId) => void }) {
  return (
    <nav
      aria-label="Admin sections"
      className="sticky top-0 z-20 -mx-4 mb-2 bg-htz-cream/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
    >
      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
        {ADMIN_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              onChange(t.id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            aria-pressed={current === t.id}
            className={`flex shrink-0 items-center gap-2 rounded-2xl px-5 py-3 font-display text-lg font-bold shadow-sm transition-colors ${
              current === t.id ? "bg-htz-navy text-htz-lime" : "bg-white text-htz-navy hover:bg-htz-lime/30"
            }`}
          >
            <span aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

// Keeps every section on the page (so unsaved edits stay put) but only shows the current tab.
export function AdminTab({ id, current, children }: { id: AdminTabId; current: AdminTabId; children: React.ReactNode }) {
  return <div className={current === id ? "contents" : "hidden"}>{children}</div>;
}
