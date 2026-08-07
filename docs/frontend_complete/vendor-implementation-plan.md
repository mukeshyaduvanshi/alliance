# Vendor Portal Frontend — Implementation Plan (F-5)

> Scope: `apps/vendor` — Vendor Self-Serve Portal
> Source of truth: `docs/Frontend-PRD.md` §7, backend `apps/backend/src/modules/vendor/*`, `apps/backend/src/modules/order/order-negotiation.service.ts`
> Status: **APPROVED ✅ (Aug 07, 2026)** — user decisions recorded, build in progress
> Follow-up of: `brand-implementation-plan.md` (F-4 ✅ complete)

## 0. Ground Rules

### 0.1 Pagination & Data Limits (MANDATORY — user requirement)
- **Har list server-side paginated** — `page`/`pageSize` params backend ko jaate hain, backend sirf current page + total count return karta hai.
- Page size = **20** (lists), **100 max** (dropdown/select data), **10** (dashboard widgets).
- Response shape consistent: `{ data: T[], meta: { total, page, perPage, hasNextPage } }` (helper `apps/backend/src/common/pagination.ts`).
- **Vendor backend gaps niche §2 mein listed hain** — wo fix hone ke baad hi vendor lists server-side honge (F-3/F-4 ki tarah).

### 0.2 Architecture Rules
- Har feature module is pattern pe banega:
  ```
  apps/vendor/app/(dashboard)/<module>/page.tsx      # route page
  apps/vendor/features/<module>/queries.ts           # TanStack Query hooks
  apps/vendor/features/<module>/components/          # tables, forms, dialogs
  ```
- Existing scaffolding reuse:
  - `apps/vendor/lib/session.ts` — vendor-session bound (`cj_vendor_session` cookie, portal `VENDOR`)
  - `apps/vendor/lib/api.ts` — ApiClient (Bearer auto)
  - `apps/vendor/components/providers.tsx` — QueryClient
  - `apps/vendor/features/auth/login-form.tsx` — vendor login → `POST /vendor-auth/login` ✅
  - `apps/vendor/features/auth/register-form.tsx` — registration wizard → `POST /vendor-registration` ✅ (doc URLs + msme/cin fields frontend mein nahi hain — minor gap, plan §4.1)
  - `apps/vendor/app/(auth)/login|register`, `(dashboard)/dashboard` — pages ✅
- `@cj/ui` reuse: DataTable (server-side mode), PageHeader, StatCard, EmptyState/ErrorState/LoadingState, Dialog, Form, Badge, Tabs, Select.
- Forms: react-hook-form + zodResolver + `@cj/ui` Form. Data fetch: TanStack Query, mutations invalidate queries.
- Types `packages/types` mein add honge (gap jahan ho), code se pehle.
- Build + typecheck har module ke baad. Backend live (port 4000) + seed data se test.

---

## 1. Module Build Order (phases)

| # | Module | PRD § | Backend endpoints | Est. size |
|---|--------|-------|-------------------|-----------|
| 0 | Auth & Onboarding | §7.1 | `POST /vendor-registration`, `GET /vendor-registration/status?email=`, `POST /vendor-auth/login`, `GET /vendor-auth/me` | S (login/register **already done**) |
| 1 | Dashboard | §7.2 | `GET /vendor/orders` (compose KPIs), `GET /vendor/notifications/unread-count` | S |
| 2 | Assigned Orders + Negotiation | §7.3 | `GET /vendor/orders?status=`, `GET /vendor/orders/:id`, `POST /vendor/orders/:id/negotiate` | L |
| 3 | Rate Card | §7.4 | `GET /vendor/products`, `POST /vendor/products/select-rate`, `GET /vendor/products/my-rates` | M |
| 4 | Payments | §7.5 | **backend gap** — payment models/endpoints exist nahi | M (see §2.5) |
| 5 | Performance | §7.6 | **backend gap** — rating/performance models exist nahi | M (see §2.6) |
| 6 | Notifications | §7.7 | `GET /vendor/notifications`, `GET /vendor/notifications/unread-count`, `PATCH /vendor/notifications/:id/read`, `PATCH /vendor/notifications/read-all` | S |

Order ka reason: Auth pehle (done), phir orders + negotiation (core flow), phir rate card, phir notifications, phir payments/performance.

---

## 2. Backend Gaps (pagination/features — user requirement verify)

### 2.1 `GET /vendor/orders` — pagination MISSING
- `apps/backend/src/modules/order/order-negotiation.service.ts` → `findAllForVendor(vendorId, status?)` — `findMany` bina `skip`/`take`/`count`.
- **Fix:** `page`/`pageSize` params + `buildPaginated`. Controller `vendor-order.controller.ts` mein `@Query('page')`/`@Query('pageSize')` add.

### 2.2 `GET /vendor/products/my-rates` — pagination MISSING
- `apps/backend/src/modules/vendor/vendor-rate.service.ts` → `listOwnRates(vendorId)` — full list.
- **Fix:** `page`/`pageSize` + `buildPaginated`.

### 2.3 `GET /vendor/products` (browse) — pagination MISSING
- `vendorRateService.browseProducts(tenantId)` — full list (dropdown/shortlist ke liye 100 cap).
- **Fix:** `page`/`pageSize` + `buildPaginated` (select/negotiation flow ke liye).

### 2.4 `GET /vendor/notifications` — controller pagination params PASS nahi hote
- `notification.service.listForRecipient()` ab paginated hai (F-4 fix), par `vendor-notification.controller.ts` `page`/`pageSize` forward nahi karta (service default 20 laga deta hai).
- **Fix:** controller mein `@Query('page')`/`@Query('pageSize')` add (brand controller jaise).

### 2.5 Payments (§7.5) — backend MISSING
- PRD: "payment status per order, payment history". Backend mein **koi `VendorPayment` model nahi**, koi endpoint nahi.
- **Options (user decide):**
  - (A) **Stub/read-only screen** — order list se `PAYMENT_PENDING`/`PAYMENT_RECEIVED` orders dikhao (compose from `/vendor/orders`), "payment history" out-of-scope. — **Recommended (chhota, backend change nahi)**
  - (B) Full `VendorPayment` model + endpoints (migration + admin/vendor endpoints) — bada scope.

### 2.6 Performance (§7.6) — backend MISSING
- PRD: "my ratings, performance reports, feedback". Backend mein **koi rating/performance model nahi**.
- **Options (user decide):**
  - (A) **Stub** — "coming soon" screen, ratings/performance out-of-scope for v1. — **Recommended**
  - (B) Full rating model + endpoints (migration + feedback) — bada scope.

### 2.7 Vendor-driven status update (§7.3 "update production/delivery progress") — backend MISSING
- PRD: vendor updates production/delivery progress. Backend sirf admin ka `PATCH /orders/:id/status` hai.
- **Options (user decide):**
  - (A) **Skip** — status updates admin side hi rehte hain (vendor read-only progress timeline dekhta hai). — **Recommended (PRD line minor)**
  - (B) `PATCH /vendor/orders/:id/status` (limited transitions: VENDOR_ASSIGNED→IN_PRODUCTION→INSTALLATION_COMPLETE) — backend change chahiye.

### 2.8 Order accept/decline (§7.3 "accept/negotiate") — backend MISSING
- PRD: "accept/negotiate order amount". Assignment unilateral hai (admin assigns, vendor ko notification jaata hai). Accept endpoint nahi.
- **Options (user decide):**
  - (A) **Accept = implicit** (assignment accept hota hai) + negotiate option. — **Recommended (backend change nahi)**
  - (B) `POST /vendor/orders/:id/accept` endpoint (status VENDOR_ASSIGNED confirm) — backend change.

### 2.9 Dashboard KPI — no dedicated endpoint
- PRD §7.2: "assigned orders, production progress, upcoming delivery, payment status, ratings".
- No `/vendor/dashboard` endpoint. Compose karenge: `/vendor/orders` `meta.total`, status counts, unread count.

---

## 3. Existing Scaffolding (already done — reuse)

- `apps/vendor/lib/session.ts` — portal-bound session (cookie `cj_vendor_session`) ✓
- `apps/vendor/lib/api.ts` — ApiClient ✓
- `apps/vendor/components/providers.tsx` — QueryClient + @cj/ui Providers ✓
- `apps/vendor/features/auth/login-form.tsx` — vendor login → `POST /vendor-auth/login` ✓
- `apps/vendor/features/auth/register-form.tsx` — registration wizard → `POST /vendor-registration` ✓
- `apps/vendor/app/(auth)/login|register`, `(dashboard)/dashboard` — pages ✓
- `apps/vendor/lib/navigation.ts` — nav already: Dashboard, Orders (Assigned Orders, Negotiations), Rate Card, Payments, Performance, Notifications ✓
- **Gap:** register form mein `msmeNumber`/`cinNumber`/`panDocUrl`/`gstDocUrl`/`msmeDocUrl`/`cinDocUrl` fields nahi hain (backend `RegisterVendorDto` accept karta hai) — plan §4.1 mein add karenge. Success ke baad `/login` redirect bhi add hoga.

---

## 4. Module Details

### 4.1 Auth & Onboarding (`/login`, `/register`) — ✅ mostly done
- Login/register built. **Enhance:** register form mein document URL + msme/cin optional fields add karna (backend DTO ke saath align), submit ke baad `/login` redirect.
- `GET /vendor-auth/me` — dashboard layout ke user name ke liye (ab hardcoded "Vendor User" hai).

### 4.2 Dashboard (`/dashboard`)
- **Data:** compose (pagination-aware): `useVendorOrders()` → `meta.total` + status counts (assigned, in-production, completed), unread notifications count.
- **UI:** StatCards (Assigned Orders, In Production, Payments Pending — from order statuses, My Rating — pending/stub) + Recent Assigned Orders list (pageSize 10).

### 4.3 Orders & Negotiation (`/orders`, `/orders/[id]`)
- **Routes:** `/orders` (list + status filter), `/orders/negotiations` (my negotiation history — compose from order details), `/orders/[id]` (detail).
- **List:** `GET /vendor/orders?status=&page=&pageSize=` (paginated, §2.1) + status filter tabs.
- **Detail:** `GET /vendor/orders/:id` — items table (product, qty, region, rate snapshot, vendor amount), artwork files, status timeline, negotiations history.
- **Negotiate:** propose new amount → `POST /vendor/orders/:id/negotiate` `{proposedAmount, remarks}` (status `VENDOR_ASSIGNED`/`IN_PRODUCTION` par allowed). Negotiation status (PENDING/ACCEPTED/REJECTED) badge + history.
- **Accept/decline:** §2.8 decision ke hisaab se (Recommended: implicit accept + negotiate).

### 4.4 Rate Card (`/rates`)
- **Routes:** `/rates`
- **Data:** `GET /vendor/products/my-rates` (paginated, §2.2) — my selected region rates.
- **Select rate flow:** `GET /vendor/products` (paginated browse, §2.3) → pick product + region → `POST /vendor/products/select-rate`. Product detail showing master region rates (`GET /vendor/products` includes `vendorRegionRates`).
- **UI:** DataTable of my rates (product, region, rate, active) + "Add Rate" dialog (product select + region select from master).

### 4.5 Payments (`/payments`)
- §2.5 decision ke hisaab se.
- **(A) Recommended:** read-only screen — orders with `PAYMENT_PENDING`/`PAYMENT_RECEIVED` status (compose from `/vendor/orders`), filter tabs. Payment history note: "full payment module future scope".
- **(B) Full module:** VendorPayment model + endpoints (needs approval + migration).

### 4.6 Performance (`/performance`)
- §2.6 decision ke hisaab se.
- **(A) Recommended:** stub screen with "Ratings & performance reports coming soon" + summary from order stats (completed orders count, cancellation count).
- **(B) Full module:** rating model + endpoints.

### 4.7 Notifications (`/notifications`)
- **Routes:** `/notifications`
- **Data:** `GET /vendor/notifications?page=&pageSize=` (pagination controller fix, §2.4), unread-count badge in layout.
- **Actions:** mark read (`PATCH :id/read`), mark all read (`PATCH read-all`).
- **UI:** notification list (title, message, link, time) + read/unread states.

---

## 5. Navigation update (`apps/vendor/lib/navigation.ts`)
- Already has all sections ✓. Verify `/orders/negotiations`, `/rates`, `/payments`, `/performance` routes exist in layout routing.

---

## 6. Testing Plan (har module)
1. `tsc --noEmit` (apps/vendor) clean.
2. Backend curl: har vendor endpoint paginated response shape verify (`data`/`meta.total`).
3. Browser test (Playwright): login → har route renders, koi console error nahi, network requests `pageSize=20` ke saath ja rahe hain.
4. Server-side verify: list page par network tab mein `GET /vendor/orders?page=1&pageSize=20` dikhna chahiye (sara data nahi).
5. Mutation flows: negotiate propose, select rate, mark-notification-read — UI state refresh (query invalidate).

---

## 7. Backend Work Needed (before/alongside F-5)

| # | Endpoint | Change | Priority |
|---|----------|--------|----------|
| 1 | `GET /vendor/orders` | pagination (`page`/`pageSize` + `buildPaginated`) | High |
| 2 | `GET /vendor/products/my-rates` | pagination | High |
| 3 | `GET /vendor/products` (browse) | pagination (cap 100) | Medium |
| 4 | `GET /vendor/notifications` | controller `page`/`pageSize` forward (service already paginated) | Medium |
| 5 | Payments | §2.5 — **decision needed** (Recommended: stub/compose, no backend) | Low/Decision |
| 6 | Performance | §2.6 — **decision needed** (Recommended: stub, no backend) | Low/Decision |
| 7 | Vendor-driven status update | §2.7 — **decision needed** (Recommended: skip, admin-side) | Low/Decision |
| 8 | Order accept/decline | §2.8 — **decision needed** (Recommended: implicit accept) | Low/Decision |

> Pagination fixes (#1–#3) same pattern as F-3/F-4 — `apps/backend/src/common/pagination.ts` helper reuse. Payments/Performance/accept/status-update are **feature decisions** — user approval required before backend work.

---

## 8. Out of Scope (abhi nahi)
- VendorPayment / VendorPerformance **full models** (if (A) chosen — stub/compose instead)
- Vendor-driven order status transitions (if (A) chosen)
- Order accept/decline endpoints (if (A) chosen)
- Mobile apps

---

## Approval Checklist (user confirm kare) — DECIDED ✅ (Aug 07)
1. ✅ Pagination policy: sab server-side (`page`/`pageSize`), page size 20/100/10.
2. ✅ Backend gaps #1–#3 (vendor pagination) fix karna — approved.
3. ✅ Gap #4 (notifications controller params) fix karna — approved.
4. ✅ **Payments (§7.5):** (A) **read-only compose screen** — order list se PAYMENT_PENDING/PAYMENT_RECEIVED dikhao, full history out-of-scope. Koi backend change nahi.
5. ✅ **Performance (§7.6):** (A) **order stats only** — completed/cancelled counts + earnings, ratings/feedback out-of-scope. Koi backend change nahi.
6. ✅ **Order accept (§7.3):** (A) **implicit accept** + negotiate. Koi backend change nahi.
7. ✅ **Production/delivery update (§7.3):** (A) **skip** — status updates admin-side, vendor read-only timeline.
8. ✅ Module order (Dashboard → Orders → Rate Card → Notifications → Payments → Performance) OK.
9. ✅ Koi KAM-chat jaisa exclusion nahi — saare vendor modules PRD ke hisaab se.

> **Kya build karna hai:** saare frontend modules (Dashboard, Orders+Negotiation, Rate Card, Payments read-only, Performance stats, Notifications) + backend pagination fixes (#1–#4). Payments/Performance depth user decision (A) ke hisaab se chhota.

---

## 9. Build Log (Aug 07, 2026)

- **Backend:** vendor pagination — `findAllForVendor` (page/pageSize + `buildPaginated`, negotiations included), `browseProducts`, `listOwnRates`, `vendor-notification.controller` page/pageSize params. `ProductStatus` enum import fix. `vendor_onboarding` workflow rule seeded (0 steps → manual approval flow, F-4 fix).
- **Types:** `VendorOrderDto`, `VendorOrderItemDto`, `VendorOrderArtworkDto`, `VendorOrderNegotiationDto`, `VendorProductRateDto`, `ProposeNegotiationInput`.
- **Vendor frontend:** Dashboard (KPIs + recent orders), Orders (list + status tabs, detail with items/rates/artwork/negotiation history, negotiate dialog), Negotiations history page, Rate Card (my rates + add-rate dialog with product/region), Payments (read-only, received/pending totals), Performance (completed/earnings/cancelled stats), Notifications (read/mark-all).
- **Seed:** vendor account `vendor@printpro.com / Vendor@123`, `vendor_onboarding` rule, `VendorRegionRate` per product (70% of brand rate), sample order assigned to vendor.
- **Tests:** Playwright `vendor_test.mjs` 8/8 routes PASS; `vendor_e2e.mjs` + `vendor_e2e2.mjs` ALL PASS (data visible, negotiate button, negotiation history); `vendor_neg.mjs` ACCEPTED history visible. Backend curl: propose → admin ACCEPTED → vendorTotal 4200 verified.
