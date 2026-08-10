# Manager Portal Frontend — Implementation Plan (F-6)

> Scope: `apps/manager` — KAM / Manager Portal (internal team)
> Source of truth: `docs/Frontend-PRD.md` §5, backend `apps/backend/src/modules/*` (auth, order, brand, vendor, workflow-instance, monitoring, notification)
> Status: **APPROVED ✅ (Aug 07, 2026)** — user decisions recorded, build in progress
> Build: **COMPLETE ✅ (Aug 08, 2026)** — saare F-6 modules built + backend verified. See §9.
> Follow-up of: `vendor-implementation-plan.md` (F-5 ✅ complete)

## 0. Ground Rules

### 0.1 Permission-Based Access (MANDATORY — user requirement)

> **"Ye internal team hai, isme tabhi kaam hoga jab admin kuch permission dega."**

- Manager portal **role-based + permission-gated** hai. Admin `apps/admin` (Roles & Permissions matrix) se role ko permissions deta hai; manager portal usi role ke user ko sirf wahi dikhata hai jiski permission hai.
- **Backend already enforces permissions** (har endpoint par `@RequirePermission(module, action)` + `PermissionsGuard` DB se `rolePermission` check karta hai). Agar user ke paas permission nahi to API 403 `ForbiddenException` dega.
- **Frontend bhi gate karega** — page/section/button visibility permission se. Iske liye `GET /users/me` endpoint chahiye jo current user ki role + permissions return kare (**backend gap §2.1**).
- Admin bypass: `PermissionsGuard` mein `user.isAdmin` → sab allowed.
- **Agar koi page par permission nahi hai** → "Access Denied" screen dikhega (redirect nahi, taaki role badalne par turant dikh jaye).

### 0.2 Pagination & Data Limits (MANDATORY — user requirement)

- **Har list server-side paginated** — `page`/`pageSize` backend ko jaate hain.
- Page size = **20** (lists), **100 max** (dropdown/select data), **10** (dashboard widgets).
- Response shape consistent: `{ data: T[], meta: { total, page, perPage, hasNextPage } }`.
- Backend ke saare manager-relevant list endpoints pehle se paginated hain (F-3 verification) — naya koi pagination gap nahi.

### 0.3 Architecture Rules

- Har feature module is pattern pe banega:
  ```
  apps/manager/app/(dashboard)/<module>/page.tsx      # route page
  apps/manager/features/<module>/queries.ts           # TanStack Query hooks
  apps/manager/features/<module>/components/          # tables, forms, dialogs
  ```
- Existing scaffolding reuse:
  - `apps/manager/lib/session.ts` — manager-session bound (`cj_manager_session` cookie, portal `MANAGER`, **JWT `type: 'internal'`**)
  - `apps/manager/lib/api.ts` — ApiClient (Bearer auto)
  - `apps/manager/components/providers.tsx` — QueryClient
  - `apps/manager/features/auth/login-form.tsx` — internal login → `POST /auth/login` ✅
  - `apps/manager/app/(auth)/login`, `(dashboard)/dashboard` — pages ✅
- **Admin app is reference** — manager pages admin ke templates mirror karenge (orders, brands, vendors, SLA, alerts).
- `@cj/ui` reuse: DataTable (server-side mode), PageHeader, StatCard, EmptyState/ErrorState/LoadingState, Dialog, Form, Badge, Tabs, Select.
- Forms: react-hook-form + zodResolver + `@cj/ui` Form. Data fetch: TanStack Query, mutations invalidate queries.
- Types `packages/types` mein add honge (gap jahan ho), code se pehle.
- Build + typecheck har module ke baad. Backend live (port 4000) + seed data se test.
- **Dependencies add karna hoga** (admin/brand jaise): `@tanstack/react-table`, `sonner`, `react-hook-form`, `@hookform/resolvers`, `lib/permissions.ts` (`usePermission`), `lib/query-client.ts`.

---

## 1. Module Build Order (phases)

| #   | Module                                         | PRD §       | Backend endpoints                                                                                                                                                                                                    | Est. size |
| --- | ---------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 0   | Auth & Session (login + **permissions fetch**) | §5          | `POST /auth/login`, **`GET /users/me` (gap §2.1)**                                                                                                                                                                   | S         |
| 1   | Dashboard                                      | §5.1        | `GET /dashboard/kam`, `GET /dashboard/sla-status`, `GET /workflow-instances/pending`, `GET /alerts?isResolved=false`, `GET /notifications/unread-count`                                                              | S         |
| 2   | My Brands                                      | §5.2        | `GET /dashboard/kam` (assigned brands), `GET /brands/:id`, `GET /brands/:brandId/business-model`, `GET /brands/:brandId/purchase-orders`                                                                             | M         |
| 3   | Orders                                         | §5.3        | `GET /orders?status=`, `GET /orders/:id`, `PATCH /orders/:id/status`, `POST /orders/:id/assign-vendor`, `POST /orders/:id/creative-artwork`, `GET /orders/:id/negotiations`, `POST /orders/negotiations/:id/respond` | L         |
| 4   | Approvals                                      | §5.4        | `GET /workflow-instances/pending`, `POST /workflow-instances/:id/approve`, `POST /workflow-instances/:id/reject`, `GET /workflow-instances` (history)                                                                | M         |
| 5   | Vendors                                        | §5.5        | `GET /vendors?status=`, `GET /vendors/:id`, vendor orders (compose from `/orders?vendorId=`)                                                                                                                         | M         |
| 6   | SLA & Alerts                                   | §5.6        | `GET /sla-rules`, `GET /dashboard/sla-status`, `GET /alerts?isResolved=false`, `PATCH /alerts/:id/resolve`                                                                                                           | M         |
| 7   | Notifications                                  | §7 (shared) | `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`                                                                                            | S         |

Order ka reason: Auth + permissions pehle (core requirement), phir dashboard, phir core ops (orders/brands/approvals), phir vendor/SLA, phir notifications.

---

## 2. Backend Gaps

### 2.1 `GET /users/me` — MISSING (permission gating ke liye REQUIRED)

- Frontend `usePermission` ko user ki permissions chahiye. Abhi:
  - `POST /auth/login` response mein **permissions nahi** hain (sirf `user: { id, fullName, email, roleId, roleName, tenantId, isAdmin }`).
  - Koi internal `GET /users/me` endpoint nahi (brand/vendor portals mein hai, internal mein nahi).
- **Fix:** `GET /users/me` add karna (JwtAuthGuard):
  - Response: `{ id, fullName, email, roleId, roleName, isAdmin, permissions: [{ module, action }], assignedBrandIds: [ids] }`
  - `permissions` = user ke role ke `rolePermissions` se (`rolePermission.permission.module/action`).
  - Manager app login ke baad `GET /users/me` call karke session enrich karega (ya login response mein permissions add).

### 2.2 `GET /workflow-instances/pending` — non-paginated

- Approvals feed abhi plain list. Chhota hai (my-role pending) — page size 20 cap ke liye `page`/`pageSize` add kar sakte hain. **Optional.**

### 2.3 Approvals "escalate" (§5.4) — backend MISSING

- PRD: "approve / reject / **escalate**". Backend mein sirf approve/reject hai, escalate endpoint nahi.
- **Options (user decide):**
  - (A) **Skip** — approve/reject enough. — **Recommended**
  - (B) Escalate endpoint (step bump + notification) — backend change.

### 2.4 Vendor performance/ratings (§5.5) — backend MISSING

- PRD: "vendor performance reports & ratings". Backend mein rating model nahi (F-5 decision bhi yahi tha).
- **Options (user decide):**
  - (A) **Order stats** (vendor orders count, total, by status — compose from `/orders?vendorId=`). — **Recommended**
  - (B) Full rating model + endpoints — bada scope.

### 2.5 Create order for a brand (§5.3) — backend has brand-side only

- PRD: "create order for a brand". Backend `POST /brand/orders` (BrandJwtAuthGuard) sirf brand token se. Internal ke liye `POST /orders` admin-side **nahi hai** (sirf `GET /orders`).
- **Options (user decide):**
  - (A) **Skip** — order creation brand portal se hota hai; manager orders track/update karta hai. — **Recommended**
  - (B) `POST /orders` (internal, JWT+Perm `order/CREATE`) — backend change.

---

## 3. Existing Scaffolding (already done — reuse)

- `apps/manager/lib/session.ts` — portal-bound session (`cj_manager_session`, JWT `type:'internal'`) ✓
- `apps/manager/lib/api.ts` — ApiClient ✓
- `apps/manager/components/providers.tsx` — QueryClient ✓
- `apps/manager/features/auth/login-form.tsx` — internal login → `POST /auth/login` ✓
- `apps/manager/app/(auth)/login`, `(dashboard)/dashboard` — pages ✓
- `apps/manager/lib/navigation.ts` — nav already: Dashboard, My Brands, Orders (All + Negotiations), Approvals (Pending + History), Vendors, SLA & Alerts, Notifications ✓
- **Gaps:** `lib/permissions.ts` (`usePermission`) nahi, `lib/query-client.ts` nahi, `@tanstack/react-table`/`sonner`/`react-hook-form`/`@hookform/resolvers` deps nahi. Layout mein user name hardcoded ("KAM") — `GET /users/me` se populate hoga.

---

## 4. Module Details

### 4.0 Auth + Permissions (core — user requirement)

- Login (`POST /auth/login`) → `GET /users/me` → session mein `permissions` + `assignedBrandIds` store.
- **UI gating (`usePermission(module, action)`):**
  - Sidebar items: sirf dikhaye jab user ke paas module ka `VIEW` permission ho (ya `isAdmin`).
  - Page: access check — permission nahi to `AccessDenied` component.
  - Buttons (approve/reject/assign/update-status): `usePermission` se enabled/hidden.
- **AccessDenied:** PageHeader + "You don't have permission to view this section. Ask an admin to grant the required permission."

### 4.1 Dashboard (`/dashboard`)

- **Data:** `GET /dashboard/kam` (assigned brands, pendingOrders, activeAlerts, recentOrders), `GET /workflow-instances/pending` (my approvals count), `GET /notifications/unread-count`, `GET /dashboard/sla-status`.
- **UI:** StatCards (Assigned Brands, Active Orders, Pending Approvals, Open Alerts) + Recent Orders table + Pending Approvals quick-approve list.

### 4.2 My Brands (`/brands`)

- **Data:** `GET /dashboard/kam` (brands assigned to me) ya `GET /brands?page=` (all, permission `brand/VIEW`).
- **Detail:** `GET /brands/:id` (contact info, business profile), `GET /brands/:brandId/business-model` (business model config), `GET /brands/:brandId/purchase-orders` (POs), `GET /orders?brandId=` (brand orders).
- **UI:** DataTable (brands) + detail view (tabs: orders, POs, business model, contact).

### 4.3 Orders (`/orders`, `/orders/[id]`, `/orders/negotiations`)

- **List:** `GET /orders?status=&brandId=&vendorId=&page=` (paginated) + status filter tabs.
- **Detail:** `GET /orders/:id` — items, brand, vendor, artwork, PO. **Actions (permission-gated):**
  - Update status (`order/EDIT`) — transition buttons (assign vendor → in production → installed → payment pending → received).
  - Assign vendor (`vendor_assignment/EDIT`) — vendor select dialog.
  - Upload artwork (`creative_artwork/CREATE`) — file URL form.
  - Negotiations respond (`order/APPROVE`) — accept/reject dialog.
- **Negotiations page:** list orders with pending negotiations + respond inline.

### 4.4 Approvals (`/approvals`, `/approvals/history`)

- **Pending:** `GET /workflow-instances/pending` (role-based — sirf wo jo meri role approve kar sakti hai). Approve/reject with remarks → `POST /workflow-instances/:id/approve|reject`.
- **History:** `GET /workflow-instances?status=` (paginated) — status badges, actions timeline.
- **UI:** card/table list + approve/reject dialog (remarks field).

### 4.5 Vendors (`/vendors`)

- **List:** `GET /vendors?status=&page=` (paginated, `vendor/VIEW`).
- **Detail:** `GET /vendors/:id` + orders via `GET /orders?vendorId=`. Performance summary = order stats (§2.4 decision).
- **UI:** DataTable + detail with orders.

### 4.6 SLA & Alerts (`/sla`, `/sla/alerts`)

- **SLA:** `GET /sla-rules` (paginated, `sla_rule/VIEW`) + `GET /dashboard/sla-status` (breached orders per rule).
- **Alerts:** `GET /alerts?isResolved=false` (paginated, `alert/VIEW`) + resolve action `PATCH /alerts/:id/resolve` (`alert/EDIT`).
- **UI:** SLA rules table + alerts table with resolve button.

### 4.7 Notifications (`/notifications`)

- **Data:** `GET /notifications?page=&pageSize=` (`INTERNAL_USER` recipient), unread-count badge in layout.
- **Actions:** mark read, mark all read.
- **UI:** notification list + read/unread states.

---

## 5. Navigation update (`apps/manager/lib/navigation.ts`)

- Already has all sections ✓. Permission-gated sidebar rendering add hoga (sirf allowed modules dikhenge).

---

## 6. Testing Plan (har module)

1. `tsc --noEmit` (apps/manager) clean.
2. Backend curl: `GET /users/me` permissions array verify; har manager endpoint paginated shape verify.
3. Browser test (Playwright): login (internal user) → har route renders, koi console error nahi.
4. **Permission test:** manager user (KAM role, limited permissions) → sirf allowed sections dikhte hain; denied section → AccessDenied.
5. Mutation flows: order status update, assign vendor, approve workflow, respond negotiation, resolve alert — UI refresh.

---

## 7. Backend Work Needed (before/alongside F-6)

| #   | Endpoint                          | Change                                                                            | Priority            |
| --- | --------------------------------- | --------------------------------------------------------------------------------- | ------------------- |
| 1   | `GET /users/me`                   | naya endpoint — role + permissions + assignedBrandIds (permission gating ke liye) | **High (required)** |
| 2   | `GET /workflow-instances/pending` | pagination (`page`/`pageSize`) — optional                                         | Low                 |
| 3   | Approvals escalate                | §2.3 — **decision needed** (Recommended: skip)                                    | Low/Decision        |
| 4   | Vendor performance/ratings        | §2.4 — **decision needed** (Recommended: order stats compose)                     | Low/Decision        |
| 5   | `POST /orders` (internal create)  | §2.5 — **decision needed** (Recommended: skip, brand creates)                     | Low/Decision        |

> **#1 required** — iske bina frontend permission gating functional nahi hai (admin/brand/vendor portals ke `GET /me` jaise).

---

## 8. Out of Scope (abhi nahi)

- Approvals escalate endpoint (if (A))
- Vendor rating model (if (A))
- Internal order creation (if (A))
- Mobile apps

---

## Approval Checklist (user confirm kare) — DECIDED ✅ (Aug 07)

1. ✅ **Permission gating policy:** manager portal admin ke permissions se controlled — `GET /users/me` se user ki permissions fetch, sidebar/pages/buttons permission-gated.
2. ✅ Backend gap #1 (`GET /users/me`) build karna — required.
3. ✅ Gap #2 (`workflow-instances/pending`) **paginate karna** — user decided.
4. ✅ **Approvals escalate (§5.4):** (B) **escalate endpoint build** — generic workflow-instance escalate (brand + vendor onboarding dono par kaam karega). User: "escalate chahiye".
5. ✅ **Vendor performance/ratings (§5.5):** (A) **order stats compose** — /orders?vendorId= se counts/totals. Koi rating model nahi.
6. ✅ **Create order for brand (§5.3):** (A) **skip** — brand portal se order banta hai, manager track/update karta hai.
7. ✅ Module order (Auth+Perm → Dashboard → Orders → Brands → Approvals → Vendors → SLA → Notifications) OK.
8. ✅ Koi KAM-chat jaisa exclusion nahi — saare manager modules PRD ke hisaab se.

> **Kya build karna hai:** saare frontend modules (Dashboard, My Brands, Orders+Negotiations, Approvals+Escalate, Vendors, SLA & Alerts, Notifications) + permission gating + backend `GET /users/me` + `workflow-instances/pending` pagination + escalate endpoint.

---

## 9. Build Log (Aug 08, 2026)

### Backend (verified against live backend on :4000)

- `GET /users/me` ✅ — returns `{ id, fullName, email, roleId, roleName, isAdmin, permissions[], assignedBrandIds[] }` (user.service `me()`).
- `GET /workflow-instances/pending?page&pageSize` ✅ — **fix:** pagination ab filter ke BAAD hoti hai + `total` = filtered count (was: skip/take in DB then filter → wrong page).
- `POST /workflow-instances/:id/escalate` ✅ — records `ApprovalAction decision:'ESCALATED'` + sets `escalatedByRoleId`/`escalatedAt`. Tested: multi-step rule (Brand Order Approval) escalate works; 0-step onboarding rules → 400 "Invalid workflow state" (no step to escalate — expected).
- Schema: `workflow_escalation` migration applied (`escalated_by_role_id`, `escalated_at`). `prisma migrate status` → up to date.

### Manager frontend (apps/manager)

- Deps added: `@tanstack/react-table`, `sonner`, `react-hook-form`, `@hookform/resolvers`.
- `lib/permissions.ts` (`usePermission` + `hasPermissionNow`), `lib/query-client.ts` (`makeQueryClient`), `components/access-denied.tsx`.
- Login form: `POST /auth/login` → `GET /users/me` → session enrich (permissions + assignedBrandIds + real fullName) → save → redirect.
- Layout: real user name from session; sidebar items permission-gated (`nav.permission`/`anyOf`); topbar notification bell wired (recent notifications + unread badge).
- Modules (sab permission-gated pages + AccessDenied):
  - Dashboard (`features/dashboard`) — StatCards + recent orders + quick approve/reject/escalate + open alerts.
  - My Brands (`features/brands`) — assigned brand cards + detail (overview/business-model/POs/orders tabs).
  - Orders (`features/orders`) — status filter tabs + assign vendor + status update; detail (items/summary/artwork/negotiations + upload artwork); negotiations page (on-demand fetch + accept/reject).
  - Approvals (`features/approvals`) — pending with **Approve/Reject/Escalate** decision dialog; history with status tabs.
  - Vendors (`features/vendors`) — list + detail (contact + performance order stats + orders).
  - SLA & Alerts (`features/sla`) — SLA rules + breached orders; alerts tabs + resolve.
  - Notifications (`features/notifications`) — all/unread/read tabs + mark read + mark all read + load more.

### Tests

- `tsc --noEmit` (backend + manager) ✅
- `eslint apps/manager` ✅ (1 `set-state-in-effect` disable comment — session sync post-hydration)
- `next build` apps/manager ✅ (15 routes)
- Backend curl: login, `/users/me`, `/dashboard/kam`, `/notifications/unread-count`, `/alerts`, `/sla-rules`, `/dashboard/sla-status`, `/orders`, `/brands`, `/vendors`, `/workflow-instances`, `pending`, escalate — sab 200 + correct shapes.
- `next start` smoke: saare routes 200 with session cookie.

### Remaining (next session)

- Playwright browser test (login → routes render, permission test: KAM limited-permission user → denied sections show AccessDenied).
