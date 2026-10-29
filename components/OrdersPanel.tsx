"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminOrder } from "@/lib/product-types";

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// Opens a simple packing slip in a new window and prints it.
function printSlip(order: AdminOrder) {
  const win = window.open("", "_blank", "width=600,height=800");
  if (!win) {
    window.alert("Please allow pop-ups to print packing slips.");
    return;
  }
  const date = new Date(order.createdAt * 1000).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
  const items = order.items
    .map((item) => `<tr><td class="q">${item.quantity} ×</td><td>${escapeHtml(item.description)}</td><td class="tick">☐</td></tr>`)
    .join("");
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Packing slip</title><style>
    body{font-family:system-ui,sans-serif;color:#0b2b3a;padding:32px;max-width:560px;margin:auto}
    h1{font-size:28px;margin:0}h1 span{color:#7aa312}.muted{color:#5b6b73;font-size:13px}
    .box{border:2px solid #0b2b3a;border-radius:12px;padding:14px;margin:18px 0;font-size:16px}
    table{width:100%;border-collapse:collapse;margin-top:12px}td{padding:8px 4px;border-bottom:1px solid #ddd;font-size:15px}
    .q{width:48px;font-weight:bold}.tick{width:24px;font-size:20px}.gift{background:#fff3e8;border-radius:12px;padding:12px;margin-top:16px}
    .thanks{margin-top:28px;text-align:center;font-size:18px}
  </style></head><body>
    <h1>Hugos<span>Toyz</span></h1><p class="muted">Order from ${escapeHtml(date)}</p>
    <div class="box"><strong>${escapeHtml(order.shippingName || order.customerName)}</strong><br>${escapeHtml(order.address || "Local pickup")}</div>
    <p class="muted">${escapeHtml(order.shippingMethod)}</p>
    <table>${items}</table>
    ${order.giftWrap ? `<div class="gift"><strong>🎁 Gift wrap</strong>${order.giftMessage ? `<br>Message: “${escapeHtml(order.giftMessage)}”` : ""}</div>` : ""}
    <p class="thanks">Thank you for shopping with HugosToyz! 💚<br><span class="muted">hugostoyz.vercel.app</span></p>
    <script>window.onload=()=>window.print()</script>
  </body></html>`);
  win.document.close();
}

function OrderCard({
  order,
  onPostedChange,
}: {
  order: AdminOrder;
  onPostedChange: (order: AdminOrder, posted: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const date = new Date(order.createdAt * 1000).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <li className={`rounded-xl border p-4 ${order.postedAt ? "border-htz-navy/10 bg-htz-cream/50" : "border-htz-orange/40"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold text-htz-navy">
          {order.shippingName || order.customerName || "Customer"}{" "}
          <span className="text-xs font-normal text-htz-navy/50">· {date}</span>
        </p>
        <p className="font-display font-bold text-htz-navy">
          {money(order.totalCents)}
          {order.discountCents > 0 && (
            <span className="ml-1 text-xs font-normal text-htz-teal">
              (−{money(order.discountCents)} discount)
            </span>
          )}
        </p>
      </div>
      <ul className="mt-2 text-sm text-htz-navy">
        {order.items.map((item, index) => (
          <li key={index}>
            <span className="font-semibold">{item.quantity} ×</span> {item.description}
          </li>
        ))}
      </ul>
      {order.giftWrap && (
        <p className="mt-2 rounded-lg bg-htz-orange/10 px-3 py-2 text-sm text-htz-navy">
          🎁 <strong>Gift wrap</strong>
          {order.giftMessage && ` – message: “${order.giftMessage}”`}
        </p>
      )}
      {order.printFiles.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {order.printFiles.map((file) => (
            <li key={file.id}>
              <a
                href={`/api/admin/print-files/${file.id}`}
                className="inline-block rounded-full bg-htz-teal px-3 py-1 text-xs font-bold text-white hover:underline"
              >
                ⬇️ Download {file.name}
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-htz-navy/70">
        {order.shippingMethod && <span className="font-semibold">{order.shippingMethod}</span>}
        {order.address && <> · {order.address}</>}
      </p>
      {order.email && (
        <p className="text-xs text-htz-navy/70">
          <a href={`mailto:${order.email}`} className="hover:underline">
            {order.email}
          </a>
        </p>
      )}
      <button
        type="button"
        onClick={() => printSlip(order)}
        className="mt-3 rounded-full border border-htz-navy/20 px-3 py-1 text-xs font-semibold text-htz-navy hover:border-htz-orange"
      >
        🖨️ Packing slip
      </button>
      {order.paymentIntentId && (
        <div className="mt-3 flex items-center gap-3">
          {order.postedAt ? (
            <>
              <span className="text-xs font-semibold text-green-700">
                ✓ Posted {new Date(order.postedAt).toLocaleDateString("en-AU")}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await onPostedChange(order, false);
                  setBusy(false);
                }}
                className="text-xs font-semibold text-htz-navy/60 hover:underline disabled:opacity-50"
              >
                Undo
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await onPostedChange(order, true);
                setBusy(false);
              }}
              className="rounded-full bg-htz-lime px-4 py-1 text-xs font-bold text-htz-navy shadow disabled:opacity-50"
            >
              {busy ? "Saving…" : "Mark as posted"}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

export default function OrdersPanel() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPosted, setShowPosted] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const response = await fetch("/api/admin/orders");
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error ?? "Couldn't load orders.");
      return;
    }
    setOrders(data.orders);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function setPosted(order: AdminOrder, posted: boolean) {
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId: order.paymentIntentId, posted }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      window.alert(data.error ?? "Couldn't update the order.");
      return;
    }
    setOrders((prev) => prev?.map((o) => (o.id === order.id ? { ...o, postedAt: data.postedAt } : o)) ?? null);
  }

  const toPost = orders?.filter((order) => !order.postedAt) ?? [];
  const posted = orders?.filter((order) => order.postedAt) ?? [];

  return (
    <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-htz-navy">
          Orders {orders && <span className="text-sm font-normal text-htz-navy/60">({toPost.length} to post)</span>}
        </h2>
        <button type="button" onClick={load} className="text-sm font-semibold text-htz-orange hover:underline">
          ↻ Refresh
        </button>
      </div>
      <p className="mt-1 text-sm text-htz-navy/60">
        Your 100 most recent paid orders from Stripe, including colours, sizes and any custom text.
      </p>

      {error && <p className="mt-3 text-sm text-htz-pink">{error}</p>}
      {!error && orders === null && <p className="mt-3 text-sm text-htz-navy/50">Loading…</p>}
      {orders && orders.length === 0 && <p className="mt-3 text-sm text-htz-navy/50">No orders yet.</p>}

      {toPost.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {toPost.map((order) => (
            <OrderCard key={order.id} order={order} onPostedChange={setPosted} />
          ))}
        </ul>
      )}

      {posted.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowPosted((show) => !show)}
            className="text-sm font-semibold text-htz-navy/70 hover:underline"
          >
            {showPosted ? "Hide" : "Show"} {posted.length} posted {posted.length === 1 ? "order" : "orders"}
          </button>
          {showPosted && (
            <ul className="mt-3 flex flex-col gap-3">
              {posted.map((order) => (
                <OrderCard key={order.id} order={order} onPostedChange={setPosted} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
