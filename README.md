# Shop SaaS frontend (Vite + React + TypeScript)

    npm install && npm run dev

## API contract (read this before building the backend)

All backend calls go through the `Api` interface in **`src/api/types.ts`** — that file
is the contract. The frontend never calls a backend directly.

- `src/api/index.ts` picks the implementation: the mock (`mock.ts`) when no
  `VITE_API_URL` is set, otherwise the real HTTP client (`http.ts`).
- `src/api/http.ts` maps every `Api` method to a REST path 1:1 — implement those
  paths on your backend and the frontend works unchanged.
- Conventions: scope every query by `storeId` and verify ownership; `platform.*`
  is platform-admin only; money/stock mutations must run server-side with
  transactions; timestamps are unix ms.

## Demo persistence

The mock backend saves a snapshot to `localStorage` (`shop-saas/mock/v1`) every
2 seconds and when the tab hides/closes, so demo data survives refresh.
Admins can wipe it from **Settings → Demo → Reset demo data**.

## Build plan

Frontend-first: every Shopify feature is built as UI + API contract + mock
behavior, phase by phase. The backend is built later against `src/api/types.ts`.

1. Foundation: API contract + persisted mock data ✓
2. Design system polish
3. Products 2.0 (variant matrix, per-variant media, metafields, digital products)
4. Collections 2.0, Inventory 2.0 (locations, transfers), Orders 2.0 (drafts, returns)
5. Customers 2.0 (segments), Discounts 2.0 (automatic, BOGO, scheduling)
6. Shipping 2.0, Taxes 2.0, Marketing 2.0 (campaigns, automations, abandoned checkouts)
7. Analytics 2.0 (reports), Storefront polish, Checkout 2.0
8. Theme builder 2.0, Settings expansion, App store UI, POS polish, Super admin

Structure: `api/` (backend layer) · `store/` (zustand) · `layouts/` · `pages/` · `components/` · `lib/`
