# Admin Portal Frontend — Implementation Plan (F-3)

> Scope: `apps/admin` — Super Admin Portal
> Source of truth: `docs/Frontend-PRD.md` §4, `docs/Frontend-TRD.md` §5–§9, backend `apps/backend/src/modules/*`
> Status: **DRAFT — awaiting approval**

## 0. Ground Rules

### 0.1 Pagination & Data Limits (MANDATORY — user requirement)
- **Har list page-limited hoga** — pehli baar kabhi full dataset nahi laenge.
- Default page size = **10–20** items per page (module ke hisaab se).
- **Server-side pagination** jahan backend support karta hai (`page`/`pageSize`/`Paginated<T>`).
- Backend pagination na ho to **client-side slice** with controls, ya backend gap ko note karna (frontend-only padding nahi).
- Koi bhi list bina pagination UI ke nahi banegi.
- Data leak/over-fetch se bachna: sirf wahi fields jo UI ko chahiye (backend DTO whitelist ke hisaab se), kabhi bhi full table dump nahi.
- Export (audit-logs) explicit action hai — default list response ke saath kabhi nahi.

> **F-3.0 Pagination Correction (user approved):** Pehla implementation client-side pagination tha (sara data fetch + browser slice) — ye galat tha. Ab **server-side pagination** banaya jaa raha hai: backend ke list endpoints `page`/`pageSize` + total count + `Paginated<T>` return karenge, aur frontend queries sirf current page ka data maangenge.

> **✅ COMPLETE (Aug 06):** Server-side pagination live hai.
> - Backend: `apps/backend/src/common/pagination.ts` (helper: `getPagination`, `buildPaginated`, `Paginated<T>`). Saare list endpoints `page`/`pageSize` + `{ data, meta: { total, page, perPage, hasNextPage } }` return karte hain: users, roles, brands, vendors, products, product-categories, orders, workflows, workflow-instances, sla-rules, alerts, purchase-orders (root `GET /purchase-orders` bhi add kiya — pehle exist nahi karta tha).
> - Security: `GET /users` aur `GET /brands` se `passwordHash` remove kiya (data leak fix).
> - Frontend: `DataTable` ab server-side mode support karta hai (`pageSize`/`totalRows`/`pageIndex`/`onPageChange` props). Har list page state + `pageSize=20` (roles/categories dropdowns `pageSize=100` kyunki form selects hain). Dashboard KPIs `meta.total` use karte hain.
> - Verify: backend curl test sab endpoints paginated ✅, browser test 17/17 PASS ✅, network request `/users?page=1&pageSize=20` ✅.

### 0.2 Architecture Rules

- Pehle **admin** complete karenge (F-3), phir brand/vendor/manager/developer.
- Har feature module is pattern pe banega:
  ```
  apps/admin/app/(dashboard)/<module>/page.tsx      # route page (server component)
  apps/admin/features/<module>/queries.ts           # TanStack Query hooks
  apps/admin/features/<module>/components/          # tables, forms, dialogs
  apps/admin/features/<module>/types.ts             # module-specific types (agar zaroori)
  ```
- Shared scaffolding jo pehle banana hoga (sirf ek baar):
  - `apps/admin/lib/query-client.ts` — QueryClient config
  - `apps/admin/lib/permissions.ts` — `usePermission(module, action)` hook
- `@cj/ui` ke components reuse: DataTable, PageHeader, StatCard, EmptyState/ErrorState/LoadingState, Form, Dialog, Badge, Tabs, Select, Checkbox, Switch.
- Forms: react-hook-form + zodResolver + `@cj/ui` Form components.
- Data fetch: TanStack Query (interactive) via `@cj/utils` ApiClient (Bearer token auto).
- Har mutation ke baad relevant query invalidate.
- Types `packages/types` mein add honge (jahan gap hai), code se pehle types file.
- Build + typecheck har module ke baad. Backend live (port 4000) + seed data se test.

---

## 1. Module Build Order (phases)

| # | Module | PRD § | Backend endpoints | Est. size |
|---|--------|-------|-------------------|-----------|
| 1 | Dashboard | §4.2 | `dashboard/kam`, `dashboard/performance`, `dashboard/sla-status`, brands/vendors/users counts | S |
| 2 | Users | §4.3 | `users` POST/GET | S |
| 3 | Roles & Permissions | §4.4 | `roles`, `roles/:id`, `roles/:id/clone`, `roles/:id/permissions`, `roles/:id/status`, `permissions` | L |
| 4 | Workflow Config | §4.5 | `workflows` CRUD + steps, `workflow-instances` list/pending/approve/reject | M |
| 5 | Brands | §4.6 | `brands` GET, `brands/:id`, `brands/:id/approve|reject|status`, `brands/:brandId/business-model`, `brands/:brandId/assign-kam` | M |
| 6 | Vendors | §4.7 | `vendors` GET, `vendors/:id`, `vendors/:id/approve|reject|status` | M |
| 7 | Catalog & Pricing | §4.8 | `product-categories`, `products` CRUD + `region-rates`, `brands/:brandId/rates` | L |
| 8 | Purchase Orders & Orders | §4.9 | `brands/:brandId/purchase-orders`, `purchase-orders/:id/status`, `orders` GET, `orders/:id`, `assign-vendor`, `status`, `negotiations` | L |
| 9 | Monitoring | §4.10 | `sla-rules`, `alerts`, `alerts/:id/resolve` | M |
| 10 | Audit Logs | §4.10 | `audit-logs`, `audit-logs/export` | S |

Order ka reason: Users/Roles pehle (hierarchy ke liye), phir workflows (approval engine), phir external entities (brand/vendor), phir commerce (catalog → PO/orders), phir monitoring/audit (read-only reporting).

---

## 2. Types Gap — `packages/types` mein add karna hoga

- `ProductDto`, `CreateProductDto`, `UpdateProductDto`, `ProductCategoryDto`, `CreateCategoryDto`
- `RegionRateInput`, `UpdateRegionRatesDto`, `AssignRateDto`, `BrandRateDto` (rich version)
- `SlaRuleDto`/`CreateSlaRuleDto` (monitoring), `ExceptionAlertDto`
- `SystemAdmin` types: SubscriptionPlanDto, LicenseDto, ErrorLogDto, EmailLogDto, SmsLogDto, BackupLogDto (agar system-admin admin mein aana hai — PRD §8 developer portal hai, admin mein optional)
- `WorkflowInstanceDto` pending-list + approve/reject input
- `ApiError`/`Paginated<T>` already exist — reuse.

---

## 3. Shared Scaffolding (pehle banao — F-3.0)

### `apps/admin/lib/query-client.ts`
```ts
import { QueryClient } from "@tanstack/react-query";
export function makeQueryClient() { return new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } }); }
```

### `apps/admin/lib/permissions.ts`
```ts
import { hasPermission } from "@cj/utils";
export function usePermission(module: string, action: string) { /* session read → boolean */ }
```
(Super Admin → always true, backend bhi bypass karta hai.)

### `apps/admin/features/auth/login-form.tsx` — already done ✓

---

## 4. Module Details

### 4.1 Dashboard (`/dashboard`)
- **Routes:** `/dashboard`
- **Features:** 4 KPI StatCards (Users, Brands, Vendors, Orders) + Pending Approvals + SLA status + recent alerts.
- **Queries:** `useDashboardKpis` → parallel: `users`, `brands?status=PENDING`, `vendors?status=PENDING`, `orders`, `dashboard/sla-status`, `alerts?isResolved=false`.
- **UI:** StatCard grid + PageHeader. Placeholder stats replace `—` with real numbers.

### 4.2 Users (`/users`)
- **Routes:** `/users`
- **Features:** list (search + role filter + status badge) + create-user dialog.
- **Queries:** `useUsers`, `useCreateUser`.
- **Form:** fullName, email, phone?, password, roleId (Select from roles).
- **Endpoints:** POST/GET `/users`. (Backend mein sirf create+list hai — no edit/deactivate/reset.)

### 4.3 Roles & Permissions (`/roles`, `/roles/permissions`)
- **Routes:**
  - `/roles` — role list + create/edit/delete/clone + status toggle
  - `/roles/permissions` — permission matrix grid (Module × Action checkboxes)
- **Queries:** `useRoles`, `useRole`(id), `usePermissions`, `useCreateRole`, `useUpdateRole`, `useDeleteRole`, `useCloneRole`, `useUpdatePermissions`, `useToggleRoleStatus`.
- **Forms:**
  - Role form: name, description?, department?, parentRoleId? (hierarchy select)
  - Clone dialog: new name
  - Matrix: Grid — rows = modules (from `/permissions`), cols = 11 actions (VIEW..SHARE); checkbox per cell; save → `roles/:id/permissions {permissionIds}`. System roles read-only.
- **UI:** DataTable + Badge (isSystemRole/status) + AlertDialog for delete.

### 4.4 Workflow Config (`/workflows/rules`, `/workflows/instances`)
- **Routes:**
  - `/workflows/rules` — rule list + create/edit + step builder
  - `/workflows/instances` — in-flight instances + pending approvals
- **Queries:** `useWorkflows`, `useWorkflow`, `useCreateWorkflow`, `useUpdateWorkflow`, `useDeleteWorkflow`, `useWorkflowSteps` (add/update/delete step), `useWorkflowInstances`, `usePendingWorkflows`, `useApproveInstance`, `useRejectInstance`.
- **Forms:**
  - Rule: name, module (Select), description?, autoApprove (Switch), escalationHours.
  - Step builder: ordered rows → approverRoleId (role select), escalationRoleId?, isOptional?, stepOrder; add/remove steps.
  - Approval dialog: remarks + approve/reject.
- **UI:** DataTable + Dialog (rule form) + step builder panel + Tabs (Rules / Instances).

### 4.5 Brands (`/brands`, `/brands/approvals`)
- **Routes:**
  - `/brands` — all brands list
  - `/brands/approvals` — PENDING queue (approve/reject with remarks)
  - `/brands/[id]` — brand detail + business model + assign KAM
- **Queries:** `useBrands`(status filter), `useBrand`, `useApproveBrand`, `useRejectBrand`, `useToggleBrandStatus`, `useBrandBusinessModel`, `useSetBusinessModel`, `useAssignKam`.
- **Forms:**
  - Approval dialog: remarks
  - Business model: businessModel (Select), commissionPercent?, markupPercent? (conditional)
  - Assign KAM: kamUserId (user select — internal users)
- **UI:** DataTable + status Badge + detail page (Tabs: Overview / Business Model / Orders).

### 4.6 Vendors (`/vendors`, `/vendors/approvals`)
- **Routes:** `/vendors`, `/vendors/approvals`, `/vendors/[id]`
- **Queries:** `useVendors`, `useVendor`, `useApproveVendor`, `useRejectVendor`, `useToggleVendorStatus`.
- **Forms:** approval remarks dialog.
- **UI:** DataTable + status Badge + detail page.

### 4.7 Catalog & Pricing (`/catalog/products`, `/catalog/categories`)
- **Routes:**
  - `/catalog/categories` — category list + create
  - `/catalog/products` — product master list + create/edit + delete
  - `/catalog/products/[id]` — detail + region rates + vendor region rates
  - `/brands/[brandId]/rates` — brand-specific rate assignment (part of brand detail)
- **Queries:** `useCategories`, `useCreateCategory`, `useProducts`, `useProduct`, `useCreateProduct`, `useUpdateProduct`, `useDeleteProduct`, `useUpdateRegionRates`, `useBrandRates`, `useAssignRate`, `useDeleteRate`, `useToggleRateStatus`.
- **Forms:**
  - Category: name, description?
  - Product: name, sku?, description?, unit?, categoryId?, imageUrls[], status?, brandRegionRates[], vendorRegionRates[] (region × rate table)
  - Rate assign: productId, region, isCustomRate?, customRate?
- **UI:** DataTable + FormDialog (multi-tab for rates) + rate table component (reusable: rows=regions, col=rate).

### 4.8 Purchase Orders & Orders
- **Routes:** `/purchase-orders`, `/orders`, `/orders/[id]`
- **Queries:**
  - PO: `usePurchaseOrders`(brandId), `useCreatePurchaseOrder`, `useTogglePoStatus`
  - Orders: `useOrders`(filters), `useOrder`, `useAssignVendor`, `useUpdateOrderStatus`, `useOrderNegotiations`, `useRespondNegotiation`
- **Forms:**
  - PO: poNumber, totalBudget; budget bar (consumed vs total)
  - Assign vendor: vendorId select
  - Status update: status select (OrderStatus enum)
  - Negotiation respond: status + responseRemarks
- **UI:** DataTable + order detail (Tabs: Timeline / Items / Negotiations) + status timeline.

### 4.9 Monitoring (`/monitoring/sla-rules`, `/monitoring/alerts`)
- **Routes:**
  - `/monitoring/sla-rules` — SLA rule CRUD
  - `/monitoring/alerts` — alert list + resolve, filter severity/resolved
- **Queries:** `useSlaRules`, `useCreateSlaRule`, `useAlerts`, `useResolveAlert`.
- **Forms:** SLA rule (name, appliesToStatus, thresholdHours); alert resolve (confirm dialog).
- **UI:** DataTable + Badge (severity) + resolve dialog.

### 4.10 Audit Logs (`/audit-logs`)
- **Routes:** `/audit-logs`
- **Queries:** `useAuditLogs`(filters page/perPage/module/action/actorType/from/to/search), `exportAuditLogs` (CSV download link).
- **UI:** DataTable + filter toolbar (module/action/date range/search) + Export button (`/audit-logs/export`).

---

## 5. Navigation update (`apps/admin/lib/navigation.ts`)
Already has all sections. Only needs active-path alignment + optional count badges (pending approvals) later.

## 6. Testing Plan (har module)
1. `pnpm --filter admin typecheck` + `pnpm build`
2. Backend up (4000) + seed data
3. Login admin → module open → list render → create/edit → invalidate → verify in DB/UI
4. Negative: unauth redirect, 400 validation toast, 403 state
5. Update `docs/frontend_complete/README.md` tracker row → ✅

## 7. Out of Scope (abhi nahi)
- Brand/Vendor/Manager/Developer feature modules (F-4 → F-7)
- Notifications realtime/polling (F-8)
- Charts (recharts wrapper), dark-mode polish (F-8)
- System Admin panel (`apps/developer`) — PRD §8
- 2FA, refresh-token rotation (backend gap)

---

### Approval Checklist (user confirm kare)
- [ ] Module order (1–10) theek hai
- [ ] Shared scaffolding (query-client, permissions hook) pehle
- [ ] Scope: admin ke liye system-admin module bahar rakha (developer portal ka)
- [ ] Backend ke current endpoints (jo abhi exist karte hain) ke hisaab se build — no frontend-only assumptions
