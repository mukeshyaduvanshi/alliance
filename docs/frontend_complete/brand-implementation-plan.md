# Brand Portal Frontend — Implementation Plan (F-4)

> Scope: `apps/brand` — Brand Self-Serve Portal
> Source of truth: `docs/Frontend-PRD.md` §6, backend `apps/backend/src/modules/*` (brand-auth, brand-order, brand-product, brand-notification)
> Status: **COMPLETE ✅ (Aug 07, 2026)** — all approved modules built + backend verified + E2E tested
> Follow-up of: `admin-implementation-plan.md` (F-3 ✅ complete)

## 0. Ground Rules

### 0.1 Pagination & Data Limits (MANDATORY — user requirement)
- **Har list server-side paginated** — `page`/`pageSize` params backend ko jaate hain, backend sirf current page + total count return karta hai.
- Page size = **20** (lists), **100 max** (dropdown/select data), **10** (dashboard widgets).
- Response shape sab jagah consistent: `{ data: T[], meta: { total, page, perPage, hasNextPage } }` (helper `apps/backend/src/common/pagination.ts`).
- **Abhi sab server se ho raha hai** (admin F-3 mein verify + fix kiya). Brand portal ke liye backend gaps niche §2 mein listed hain — wo fix hone ke baad hi brand lists server-side honge.

### 0.2 Architecture Rules
- Har feature module is pattern pe banega:
  ```
  apps/brand/app/(dashboard)/<module>/page.tsx      # route page
  apps/brand/features/<module>/queries.ts           # TanStack Query hooks
  apps/brand/features/<module>/components/          # tables, forms, dialogs
  ```
- Existing scaffolding reuse:
  - `apps/brand/lib/session.ts` — brand-session bound `saveSession`/`clearSession`/`getAccessToken` (portal `BRAND`)
  - `apps/brand/lib/api.ts` — ApiClient (Bearer auto)
  - `apps/brand/components/providers.tsx` — QueryClient
  - `apps/brand/features/auth/login-form.tsx` + `register-form.tsx` — **already built** ✓
  - `apps/brand/app/(auth)/login`, `/(auth)/register`, `(dashboard)/dashboard` — **already built** ✓
- `@cj/ui` reuse: DataTable (server-side mode), PageHeader, StatCard, EmptyState/ErrorState/LoadingState, Dialog, Form, Badge, Tabs, Select.
- Forms: react-hook-form + zodResolver + `@cj/ui` Form.
- Data fetch: TanStack Query. Har mutation ke baad relevant query invalidate.
- Types `packages/types` mein add honge (gap jahan ho), code se pehle.
- Build + typecheck har module ke baad. Backend live (port 4000) + seed data se test.

---

## 1. Module Build Order (phases)

| # | Module | PRD § | Backend endpoints | Est. size |
|---|--------|-------|-------------------|-----------|
| 0 | Auth & Onboarding | §6.1 | `POST /brand-registration`, `GET /brand-registration/status?email=`, `POST /brand-auth/login`, `GET /brand-auth/me` | S (login/register **already done**) |
| 1 | Dashboard | §6.2 | `GET /brand/orders`, `GET /brand/products`, `GET /brand/notifications/unread-count` (compose KPIs) | S |
| 2 | Products & Pricing (Rate Card) | §6.3 | `GET /brand/products`, `GET /brand/products/:id` | M |
| 3 | Orders | §6.4 | `POST /brand/orders`, `GET /brand/orders?status=`, `GET /brand/orders/:id`, `POST /brand/orders/:id/cancel` | L |
| 4 | Artwork Approval | §6.4 | `POST /brand/orders/:id/approve-artwork`, `POST /brand/orders/:id/reject-artwork` | M |
| 5 | POs & Invoices | §6.5 | PO view: **backend gap** (see §2.4), invoices: **backend gap** (see §2.5) | M |
| 6 | Notifications | §6.6 | `GET /brand/notifications`, `GET /brand/notifications/unread-count`, `PATCH /brand/notifications/:id/read`, `PATCH /brand/notifications/read-all` | S |
| 7 | KAM Chat | §6.6 | Backend message thread exist nahi — **out of scope** (future), PRD bhi "future" bola hai | S (stub) |
| 8 | Reports | §6.7 | Order history + spend + artwork history compose (existing endpoints se) | M |

Order ka reason: Auth pehle (already done), phir rate card (order place karne se pehle products dekhne hain), phir orders + artwork (core flow), phir PO/invoices, phir notifications/reports.

---

## 2. Backend Gaps (pagination/limit — user requirement verify)

> Ye fix **backend mein** honge (approved pattern — F-3.0 pagination correction ki tarah). Brand lists sirf tab server-side hongi jab ye ho jayen.

### 2.1 `GET /brand/orders` — pagination MISSING
- `apps/backend/src/modules/order/order.service.ts` → `findAllForBrand(brandId, status)` — `findMany` bina `skip`/`take`/`count`. Sara data aata hai.
- **Fix:** `page`/`pageSize` params + `buildPaginated` return. Controller `brand-order.controller.ts` mein `@Query('page')`/`@Query('pageSize')` add.

### 2.2 `GET /brand/products` — pagination MISSING
- `apps/backend/src/modules/product/brand-rate.service.ts` → `findProductsForBrand(brandId)` — `findMany` bina pagination.
- **Fix:** `page`/`pageSize` + `buildPaginated`.

### 2.3 `GET /brand/notifications` — hardcoded `take: 100`
- `apps/backend/src/modules/notification/notification.service.ts` → `listForRecipient()` — `take: 100` hardcoded, koi `page`/`pageSize`/`total` nahi.
- **Fix:** `page`/`pageSize` params + `buildPaginated` (brand + internal user dono controllers use karte hain).

### 2.4 Brand PO view — endpoint MISSING
- PRD §6.5 "View purchase orders, budget consumed". Backend mein PO view sirf admin wala hai: `GET /brands/:brandId/purchase-orders` (JwtAuthGuard + PermissionsGuard — brand token se kaam nahi karega).
- **Fix:** brand-scoped PO controller add karna (`BrandJwtAuthGuard`), e.g. `GET /brand/purchase-orders` (+ pagination) — budget consumed (PO budget vs sum of order amounts) ka computation bhi.

### 2.5 Invoices — backend module MISSING
- PRD §6.5 "Invoices & documents list/download". Backend mein koi payment/invoice/billing module exist nahi karta.
- **Fix:** Invoice module build karna (create/list by brand, file URL) — ye ek independent backend feature hai, F-4 scope mein. Agar chhota karna ho to **stub screen** with "coming soon" (documented as out of scope for v1).

### 2.6 Brand Dashboard KPI endpoint — no dedicated endpoint
- PRD §6.2: "My orders, PO budget vs consumed, artwork pending approval, recent invoices".
- No `/brand/dashboard` endpoint. Compose karenge multiple queries (orders count, pending-artwork count, unread count) — paginated endpoints se `meta.total`. Dedicated aggregate endpoint optional (agar chahiye to add karna, warna compose).

---

## 3. Existing Scaffolding (already done — reuse)

- `apps/brand/lib/session.ts` — portal-bound session wrappers ✓
- `apps/brand/lib/api.ts` — ApiClient ✓
- `apps/brand/components/providers.tsx` — makeQueryClient ✓
- `apps/brand/features/auth/login-form.tsx` — brand login (email/password → `POST /brand-auth/login`) ✓
- `apps/brand/features/auth/register-form.tsx` — registration wizard (business profile) → `POST /brand-registration` ✓
- `apps/brand/app/(auth)/login`, `(auth)/register`, `(dashboard)/dashboard` — pages ✓
- `apps/brand/lib/navigation.ts` — nav items already: Dashboard, Products & Pricing, Orders (My/Place/Artwork), Purchase Orders, Invoices & Documents, Notifications ✓
- **Gap:** `apps/brand` mein koi `lib/query-client.ts` alag se nahi (providers.tsx mein hai) — check karna, zaroorat ho to align.

---

## 4. Module Details

### 4.1 Dashboard (`/dashboard`)
- **Routes:** `/dashboard`
- **Data:** compose (pagination-aware):
  - `useMyOrders()` → `meta.total` (total orders), status counts
  - `useMyProducts()` → rate card count
  - `useArtworkPending()` → orders with `artworkStatus === "PENDING_APPROVAL"` count (from paginated orders list)
  - `useBrandNotifications()` → unread count badge
- **UI:** StatCards (Total Orders, Open POs / Budget, Pending Artwork, Unread Notifications) + Recent Orders table (pageSize 5-10, server-side) + Pending Artwork quick-approve list.
- **Backend gap:** §2.6 (compose se cover).

### 4.2 Products & Pricing — Rate Card (`/products`)
- **Routes:** `/products`, `/products/:id` (detail with region rates)
- **Data:** `GET /brand/products` (paginated, §2.2), `GET /brand/products/:id`
- **UI:** DataTable (product, category, base price, effective rate by region, custom-rate badge) + product detail showing region-wise rates.
- **Note:** brand apna rate card **read-only** dekhta hai (custom/negotiated rates admin assign karta hai).

### 4.3 Orders (`/orders`)
- **Routes:** `/orders` (list + status filter), `/orders/new` (place order), `/orders/[id]` (detail + timeline)
- **Place Order flow:** select PO (budget), add items (product + qty from rate card), artwork type (`READY`/`REFERENCE`), file upload (URL), submit → `POST /brand/orders`.
- **List:** `GET /brand/orders?status=&page=&pageSize=` (paginated, §2.1) + status filter tabs.
- **Detail:** `GET /brand/orders/:id` — items table, artwork upload, status timeline, negotiations (if any), cancel button (conditional status).
- **UI:** server-side DataTable + status tabs.

### 4.4 Artwork Approval (`/orders/artwork`)
- **Routes:** `/orders/artwork` (pending artwork list), action in order detail.
- **Data:** orders with `artworkStatus === "PENDING_APPROVAL"` (from `/brand/orders` + filter).
- **Actions:** approve/reject with remarks → `POST /brand/orders/:id/approve-artwork` | `reject-artwork`. Invalidate orders queries.
- **UI:** card/table of artwork-pending orders with preview + Approve/Reject dialog (remarks field).

### 4.5 POs & Invoices (`/purchase-orders`, `/invoices`)
- **Routes:** `/purchase-orders`, `/invoices`
- **POs:** brand-scoped list `GET /brand/purchase-orders` (**backend §2.4**) — table: PO number, budget, consumed, status, created date.
- **Invoices:** full module built (**§2.5**) — list, download, budget vs invoiced. Backend invoice endpoints `GET/POST /brand/invoices`.

### 4.6 Notifications (`/notifications`)
- **Routes:** `/notifications`
- **Data:** `GET /brand/notifications?page=&pageSize=` (paginated, §2.3), unread-count badge in layout.
- **Actions:** mark read (`PATCH :id/read`), mark all read (`PATCH read-all`).
- **UI:** notification list (title, message, link, time) + read/unread states.

### 4.7 Brand Profile — self-editing (`/profile`) — ADDED (user decision, PRD se extra)
- **Routes:** `/profile`
- **Data:** `GET /brand-auth/me` (business profile + brand info), **backend §2.7** update endpoint `PATCH /brand/profile` (contact person, phone, address fields — editable subset; verified docs/legal fields read-only).
- **UI:** profile form (read-only: legalName, PAN/GST, documents; editable: brandName, contactPersonName, phone, address fields) + save with validation.

### 4.8 Reports (`/reports`)
- **Routes:** `/reports` (tabs: Order History, Spend Analytics, Artwork History)
- **Data:** compose from orders (paginated views + summary via totals), artwork history from order detail artworks.
- **UI:** tabs + tables. Spend analytics: aggregated sums from current page + note (server-side aggregation backend gap agar chahiye).

### 4.9 KAM Chat — NOT in scope (user decision: KAM chat ke alava sab)
- KAM chat module build nahi karenge (backend missing). Assigned KAM info dashboard/profile par dikhega (`assignedKam`), `/messages` route nahi banega.

---

## 5. Navigation update (`apps/brand/lib/navigation.ts`)
- Already has all sections ✓. Add `/reports`, `/messages` (KAM chat) entries. Verify `/orders/artwork` route exists in layout routing.

---

## 6. Testing Plan (har module)
1. `tsc --noEmit` (apps/brand) clean.
2. Backend curl: har brand endpoint paginated response shape verify (`data`/`meta.total`).
3. Browser test (Playwright): login → har route renders, koi console error nahi, network requests `pageSize=20` ke saath ja rahe hain.
4. Server-side verify: list page par network tab mein `GET /brand/orders?page=1&pageSize=20` dikhna chahiye (sara data nahi).
5. Mutation flows: place order, artwork approve/reject, mark-notification-read — UI state refresh (query invalidate).

---

## 7. Backend Work Needed (before/alongside F-4) — ALL DONE ✅

| # | Endpoint | Change | Status |
|---|----------|--------|--------|
| 1 | `GET /brand/orders` | pagination (`page`/`pageSize` + `buildPaginated`) | ✅ Done |
| 2 | `GET /brand/products` | pagination | ✅ Done |
| 3 | `GET /brand/notifications` | pagination (replace `take:100`) | ✅ Done |
| 4 | `GET /brand/purchase-orders` | naya brand-scoped PO endpoint (view + budget consumed) | ✅ Done |
| 5 | Invoice module | full module: `GET/POST /brand/invoices` (list + download, budget vs invoiced) | ✅ Done |
| 6 | `GET /brand-auth/me` | check response mein `assignedKam` aata hai | ✅ Done (verify) |
| 7 | `PATCH /brand-auth/me` | brand self-edit editable fields (brandName, contactPersonName, phone, businessProfile) | ✅ Done |

> Pagination fixes (#1–#3) same pattern as F-3 — `apps/backend/src/common/pagination.ts` helper reuse. Backend gaps list yahan rahegi; frontend inke bina proper server-side pagination nahi dikha payega — isliye **backend fixes F-4 se pehle ya saath** karenge (user approval required, backend scope hai).

---

## 8. Out of Scope (abhi nahi)
- KAM real-time chat (backend missing, PRD future) — **user decision: KAM chat ke alava sab karne hain; chat build nahi hogi**
- Mobile apps

---

## Approval Checklist (user confirm kare) — ALL DONE ✅

1. ✅ Pagination policy: sab server-side (`page`/`pageSize`), page size 20/100/10.
2. ✅ Backend gaps #1–#3 (brand pagination) fix — done.
3. ✅ Brand PO endpoint (#4) + Invoice full module (#5) — built.
4. ✅ Module order (Rate Card → Orders → Artwork → PO/Invoices → Notifications → Profile → Reports) — done.
5. ⛔ KAM Chat — **NOT build** (user decision: KAM chat ke alava sab).
6. ✅ Brand self-editing profile (`/profile`) — built.

## 9. Build Log (Aug 07, 2026)

- **Backend:** Invoice model + `InvoiceStatus` enum (migration `add_invoices`, `invoice_createdby_optional`), `GET/POST /brand/invoices` (BrandInvoiceController), brand PO view, orders/products/notifications pagination, `PATCH /brand-auth/me`. Backend `tsc` + build clean. `src/...` absolute imports → relative (5 files) for runtime resolution.
- **Types:** `InvoiceDto`, `CreateInvoiceDto`, `UpdateBrandProfileDto`/`UpdateBrandBusinessProfileDto`, `BrandLoginResponse`, `InvoiceStatus` enum.
- **Brand frontend:** Dashboard (KPIs + recent orders), Products rate card (server-side DataTable), Orders (list + status tabs, place order form with PO/product/artwork, detail with approve/reject/cancel), Artwork Approval, POs (budget/consumed/progress), Invoices (download), Notifications (read/mark-all), Profile self-edit form, Reports (spend + CSV export).
- **Seed:** brand account `rahul@sharmaprints.com / Brand@123`, 3 products + PAN_INDIA rates, sample PO.
- **Tests:** Playwright `brand_test.mjs` 10/10 routes PASS; `brand_e2e.mjs` ALL PASS (data visible on every page, 0 runtime errors); `place_order_e2e.mjs` PASS (order placed from form). Backend curl: order → PO consumed, creative submit → approve artwork, invoice create/list, profile patch, notification mark-read all verified.

> **USER DECISION (Aug 06):** "approval checklist hai usme sara kaam karna hai bas KAM chat ke alava sab." → Backend gaps #1–#7, Invoice full module, Brand self-edit profile, saare frontend modules (KAM chat chhod kar) build honge.
