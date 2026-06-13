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
| `ADMIN_PASSWORD` | Password for `/admin`. Also signs the admin session cookie. |
| `STRIPE_SECRET_KEY` | Stripe secret key. Use a **test** key (`sk_test_...`) until ready to go live. |
| `NEXT_PUBLIC_SITE_URL` | Fallback base URL for Stripe redirect links. Optional for normal browser checkouts. |

## Project structure

- `app/page.tsx` — single scrolling storefront page (hero, product grid, about, footer).
- `app/admin/` — password-protected admin UI for editing products.
- `app/api/checkout/route.ts` — creates a Stripe Checkout session from the cart.
- `app/api/admin/*` — admin login/logout and product CRUD endpoints.
- `data/products.json` — product catalogue (12 products across 3 categories).
- `lib/products.ts` — reads/writes `data/products.json`.
- `lib/cart-context.tsx` — cart state, persisted to `localStorage`.
- `components/` — UI building blocks (Hero, ProductGrid, CartDrawer, etc.).

## Product data & the admin panel

Products live in `data/products.json` and are edited via `/admin`. Each
product has a `name`, `category`, `price`, `description`, `image` (a URL —
leave blank to show a placeholder icon), and an `active` flag that controls
whether it shows up in the store.

> **Production note:** the admin panel currently saves changes by writing to
> `data/products.json` on disk. This works great for local development, but
> Vercel's production filesystem is **read-only**, so edits made in the
> hosted admin panel won't persist between deployments. Before relying on the
> admin panel in production, swap `lib/products.ts` for a small database or
> Vercel KV/Postgres-backed implementation — the rest of the app only depends
> on the functions exported from that file (`getAllProducts`,
> `getActiveProducts`, `getProductById`, `saveAllProducts`), so the swap is
> isolated to one file.

## Payments

Checkout uses [Stripe Checkout](https://stripe.com/docs/payments/checkout) in
`mode: "payment"`. Prices are read server-side from `data/products.json`, so
the client never determines what gets charged. Set `STRIPE_SECRET_KEY` to a
test key to try the full flow with [Stripe's test cards](https://stripe.com/docs/testing).

## Deploying

Deploy to Vercel as usual. Set the environment variables above in the Vercel
project settings (Production and Preview), and update `STRIPE_SECRET_KEY` to
a live key when you're ready to accept real payments.
