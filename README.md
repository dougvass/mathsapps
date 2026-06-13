# HugosToyz (HTZ)

A single-page storefront for HugosToyz — playful 3D-printed fidgets and toys —
built with Next.js, Tailwind CSS, and Stripe Checkout.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the storefront, and
[http://localhost:3000/admin](http://localhost:3000/admin) for the product
admin panel.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

| Variable | Description |
| --- | --- |
| `ADMIN_PASSWORD` | Bootstrap password for `/admin`, and the secret used to sign the admin session cookie. The in-app "Change Password" form stores its own password hash, but this env var must stay set (session signing depends on it). |
| `STRIPE_SECRET_KEY` | Stripe secret key. Use a **test** key (`sk_test_...`) until ready to go live. |
| `NEXT_PUBLIC_SITE_URL` | Fallback base URL for Stripe redirect links. Optional for normal browser checkouts. |
| `BLOB_READ_WRITE_TOKEN` | Optional. Set automatically when you connect a Vercel Blob store to the project. When present, the store (products, categories, colours, sizes, settings, password hash) is persisted to Blob instead of the local `data/store.json` file — required for admin edits to persist on Vercel. |

## Project structure

- `app/page.tsx` — single scrolling storefront page (hero, product grid, about, footer).
- `app/admin/` — password-protected admin UI for editing products, categories, colours, sizes, printer limits, and the admin password.
- `app/api/checkout/route.ts` — creates a Stripe Checkout session from the cart.
- `app/api/admin/*` — admin login/logout, store CRUD, and password-change endpoints.
- `data/store.json` — local fallback copy of the store (products, categories, colours, sizes, settings).
- `lib/store.ts` — reads/writes the store, via Vercel Blob in production or `data/store.json` locally.
- `lib/products.ts` — product/store helpers built on top of `lib/store.ts`.
- `lib/cart-context.tsx` — cart state, persisted to `localStorage`.
- `components/` — UI building blocks (Hero, ProductGrid, CartDrawer, etc.).

## Store data & the admin panel

The store catalogue and settings are edited via `/admin`:

- **Products** — `name`, `category`, `price`, `description`, `image` (a URL —
  leave blank to show a placeholder icon), and an `active` flag that controls
  whether it shows up in the store.
- **Categories** — the section headings used to group products in the shop.
- **Colours** — the list of colour choices customers pick from before adding
  an item to their cart.
- **Sizes & printer limits** — the size presets customers choose from, each
  bounded by a configurable "printer max build size" (defaults to 220mm, the
  build volume of a Flashforge AD5M).
- **Admin password** — change the `/admin` login password from the panel
  itself.

Buyers must choose a colour and size for each product before it can be added
to the cart; their selection is included in the Stripe line item and the
cart.

> **Persistence:** locally, all of this is read from and written to
> `data/store.json`. On Vercel, the production filesystem is **read-only**, so
> admin edits are persisted to **Vercel Blob** instead — connect a Blob store
> to the project (Storage tab in the Vercel dashboard) to provision
> `BLOB_READ_WRITE_TOKEN` automatically. Until that's connected, admin edits in
> production won't be saved.

## Payments

Checkout uses [Stripe Checkout](https://stripe.com/docs/payments/checkout) in
`mode: "payment"`. Prices are read server-side from the store, so the client
never determines what gets charged. Set `STRIPE_SECRET_KEY` to a test key to
try the full flow with [Stripe's test cards](https://stripe.com/docs/testing).

## Deploying

Deploy to Vercel as usual. Set the environment variables above in the Vercel
project settings (Production and Preview), connect a Vercel Blob store so
admin edits persist, and update `STRIPE_SECRET_KEY` to a live key when you're
ready to accept real payments.
