# Frontend Technical Requirements Document (Frontend TRD)

## Cjalliance Enterprise Platform — Frontend Applications

**Version:** 1.0

**Based on:** Cjalliance Frontend PRD v1.0, Cjalliance TRD v1.0

**Audience:** Frontend Development Team

---

## 1. Purpose

This document is the technical blueprint for all five frontend applications. It defines the monorepo layout, the shared shadcn/ui design system, per-app scaffolding conventions, data-fetching approach, auth integration, and routing/guard strategy — all mapped to the existing NestJS backend.

---

## 2. Architecture Overview

Single design system, five independent Next.js apps, one shared backend.

```
                       ┌────────────────────────────┐
                       │   api.cjalliance.com       │
                       │   (NestJS, /api/v1)        │
                       └─────────────┬──────────────┘
                                     │  REST + JWT
     ┌───────────┬───────────┬───────┴────────┬─────────────┐
 admin          manager       brand          vendor      developer
 (Admin)  (KAM/Ops)   (Brand)         (Vendor)    (System Ops)
     │              │            │               │             │
     └──────────────┴────────────┴───────────────┴─────────────┘
                                    │
                          ┌─────────┴─────────┐
                          │   packages/        │
                          │ ui · types · utils │
                          │ config             │
                          └───────────────────┘
```

**Key principles:**

- Shared design system via `packages/ui` (shadcn/ui) — no duplicated components across apps.
- Shared types in `packages/types` mirror the backend Prisma enums + DTOs (no contract drift).
- Server Components by default; client components only where interactivity is needed.
- All data flows through the backend API; no direct DB access from frontend.
- Tenant/role/permission decisions enforced server-side; frontend only adapts the UI.

---

## 3. Tech Stack

| Concern                | Technology                                        | Notes                                    |
| ---------------------- | ------------------------------------------------- | ---------------------------------------- |
| Monorepo               | Turborepo + pnpm                                  | Existing setup                           |
| Framework              | Next.js 16 (App Router)                           | React 19, one app per portal             |
| Language               | TypeScript 5 strict                               | Shared config from `packages/config`     |
| Styling                | Tailwind CSS v4 + CSS variables                   | Design tokens in `packages/ui`           |
| UI Components          | shadcn/ui (Radix primitives)                      | Canonical source in `packages/ui`        |
| Component library pkg  | `@cj/ui` (packages/ui)                            | Consumed by all apps                     |
| Icons                  | lucide-react                                      | Standard for shadcn/ui                   |
| Data fetching          | TanStack Query v5 (client) + fetch (server)       | Hooks per module                         |
| Forms                  | react-hook-form + zod                             | With shadcn/ui form components           |
| Tables                 | TanStack Table (headless)                         | Data-table pattern from shadcn/ui        |
| Charts                 | recharts                                          | Dashboards                               |
| Client state           | zustand (UI/global only, e.g. current role perms) | Minimal — backend is source of truth     |
| Auth                   | JWT access (Bearer) + refresh (httpOnly cookie)   | Per-portal login, matches backend        |
| HTTP client            | native fetch wrapper in `packages/utils`          | Auto refresh-token + redirect on 401     |

---

## 4. Monorepo Layout (Frontend)

```
apps/
  admin/        Next.js — Admin Portal
  manager/      Next.js — KAM / Internal Portal
  brand/        Next.js — Brand Portal
  vendor/       Next.js — Vendor Portal
  developer/    Next.js — System Admin Panel

packages/
  ui/           shadcn/ui design system + shared layout components
  types/        Shared TS types (mirrors backend Prisma schema)
  utils/        Shared helpers: api client, formatters, auth
  config/       Shared eslint / tsconfig presets
```

### 4.1 `packages/ui` — Design System

The single source of truth for all UI. Apps **must not** hand-roll primitives.

```
packages/ui/
  components.json
  src/
    styles/globals.css          # Tailwind v4 theme + shadcn CSS variables (light/dark)
    lib/utils.ts                # cn() helper
    components/
      ui/                       # shadcn/ui primitives: button, input, card, table,
                                #   dialog, dropdown-menu, form, tabs, badge, toast,
                                #   select, avatar, skeleton, separator, sheet, ...
      layout/                   # app-shell, sidebar, topbar, page-header, notifications-popover
      data-table/               # DataTable (TanStack Table + shadcn styling)
      charts/                   # chart wrapper (recharts + shadcn tokens)
      feedback/                 # empty-state, error-boundary, loading, confirm-dialog
    hooks/                      # use-mobile, use-permissions (from role perms)
```

### 4.2 `packages/types` — Shared Types

Mirrors the backend so frontend/backend never drift. Enums copied from Prisma schema + API response shapes.

```
packages/types/
  src/
    index.ts
    enums.ts                    # RoleStatus, PermissionAction, OrderStatus, WorkflowInstanceStatus,
                                #   BrandApprovalStatus, VendorApprovalStatus, NegotiationStatus,
                                #   AlertType, AlertSeverity, BusinessModelType, ActorType, ...
    api/
      auth.ts                   # LoginDto, LoginResponse, RefreshResponse
      user.ts                   # UserDto, CreateUserDto, ...
      role.ts                   # RoleDto, RolePermissionMatrix, ...
      workflow.ts               # WorkflowRuleDto, WorkflowStepDto, WorkflowInstanceDto
      order.ts                  # OrderDto, OrderItemDto, OrderArtworkDto
      brand.ts                  # BrandDto, BrandRegistrationDto
      vendor.ts                 # VendorDto, NegotiationDto
      audit.ts                  # AuditLogDto, AuditLogQuery
      notification.ts           # NotificationDto
      monitoring.ts             # SlaRuleDto, ExceptionAlertDto
      system.ts                 # SubscriptionPlanDto, LicenseDto, ErrorLogDto
      common.ts                 # Paginated<T>, ApiError, TenantContext
```

### 4.3 `packages/utils` — Shared Helpers

```
packages/utils/
  src/
    index.ts
    api-client.ts               # fetch wrapper: baseURL, JSON, auth header,
                                #   401 → refresh → retry, error normalization
    auth.ts                     # token storage, isAuthenticated, getTenantId, role perms helpers
    format.ts                   # currency (INR), date, number formatting
    validators.ts               # phone, GSTIN, PAN, email validators (zod schemas)
    pagination.ts               # cursor/offset params builders
```

### 4.4 `packages/config` — Shared Configs

```
packages/config/
  eslint/base.mjs
  tsconfig/base.json
  tsconfig/nextjs.json
```

---

## 5. App Scaffolding Convention (per app)

Every app follows the same folder contract so developers move between portals seamlessly.

```
apps/<app>/
  .env.local                       # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_APP_PORTAL
  next.config.ts
  middleware.ts                    # route protection (portal-level, based on auth)
  src/
    app/
      layout.tsx                   # root layout → imports @cj/ui styles
      (auth)/
        login/page.tsx
        register/page.tsx          # brand & vendor only
      (dashboard)/
        layout.tsx                 # AppShell (sidebar + topbar + notifications)
        page.tsx                   # Dashboard home
        ...                        # feature routes per Frontend-PRD
    components/                    # app-specific components
    features/                      # feature modules (list + create/edit + hooks per feature)
    lib/
      api.ts                       # app-level api client instance (portal type set)
      auth.ts                      # session helpers, portal guard
      query-client.ts              # TanStack Query provider config
      permissions.ts               # usePermission(module, action)
      navigation.ts                # sidebar nav config (role-aware)
    providers.tsx                  # QueryClientProvider + ThemeProvider + Toaster
```

### 5.1 Data Fetching Pattern

- **Server Components** fetch initial data with `fetch()` + `cache()` for static-ish lists.
- **Interactive data** uses TanStack Query hooks defined in `features/<name>/queries.ts`.
- All queries go through the shared `api-client` so auth/refresh/errors are uniform.
- Mutations call backend, then invalidate the relevant query key.

### 5.2 Route Guards

- `middleware.ts` redirects unauthenticated users to `/login`.
- Portal is fixed per app (no cross-portal login).
- Permission-level hiding is done in the UI: `usePermission('orders','APPROVE')` renders action buttons conditionally.
- 403 states handled gracefully (empty-state with "contact admin").

---

## 6. Design System Details (shadcn/ui)

### 6.1 Setup

- shadcn/ui initialized **once** in `packages/ui` (`components.json` with `@cj/ui` alias).
- Tailwind v4 theme in `src/styles/globals.css` with the full shadcn token set (background, foreground, card, primary, destructive, ring, radius, sidebar, chart colors) supporting **light + dark**.
- `cn()` from `packages/ui` is the only class merge helper used.

### 6.2 Component Inventory (Phase 1 baseline)

Button, Input, Label, Textarea, Card, Badge, Avatar, Skeleton, Separator, Table, DataTable wrapper, Dialog, DropdownMenu, Select, Tabs, Form, Checkbox, Switch, RadioGroup, Tooltip, Toast (sonner), Sheet, Pagination, EmptyState, ErrorBoundary, Loading, ConfirmDialog, Sidebar/Topbar shell, NotificationsPopover, StatCard, PageHeader.

### 6.3 Branding

- White-label ready: brand name/logo/tokens come from a per-portal config (`NEXT_PUBLIC_APP_PORTAL` + tenant settings), so rebranding is a config change.

---

## 7. Authentication & Session (per portal)

1. User logs in → backend returns JWT access token.
2. Access token kept in memory / short-lived; refresh token in httpOnly cookie (backend sets it).
3. `api-client` attaches `Authorization: Bearer <access>`; on 401 it calls `/auth/refresh`, retries once, else redirects to `/login`.
4. On login response, role + permission list cached in `packages/utils` (and optionally zustand) for UI decisions.
5. Logout calls backend revoke endpoint and clears client state.

---

## 8. Backend Endpoint Mapping (reference)

Frontend modules consume these existing backend routes (under `apps/backend/src/modules`):

| Frontend Module      | Backend Module(s)                      |
| -------------------- | -------------------------------------- |
| Auth / login         | `auth`, `brand/auth`, `vendor/auth`    |
| Users                | `user`                                 |
| Roles & Permissions  | `role`, `permission`                   |
| Workflow config      | `workflow-rule`, `workflow-instance`   |
| Brands               | `brand`                                |
| Vendors              | `vendor`                               |
| Products & Pricing   | `product`, `brand`, `vendor` rates     |
| Orders / POs         | `order`, `purchase-order`              |
| Negotiations         | `vendor` (negotiation endpoints)       |
| Audit Logs           | `audit-log`                            |
| Notifications        | `notification`                         |
| SLA / Alerts         | `monitoring`                           |
| System admin         | `system-admin`, `monitoring`           |
| Business model       | `business-model`                       |

---

## 9. Phases (Frontend)

| Phase | Scope                                                             |
| ----- | ----------------------------------------------------------------- |
| F-1   | `packages/ui` shadcn baseline + `packages/types/utils/config`     |
| F-2   | App shells (layout, sidebar, auth, guards) on all 5 apps          |
| F-3   | Admin portal features (users, roles, permissions, workflows)      |
| F-4   | Brand portal features (orders, artwork, POs, invoices)            |
| F-5   | Vendor portal features (orders, negotiation, rates, payments)     |
| F-6   | Manager portal (approvals, SLA, alerts, brands)                   |
| F-7   | Developer panel (logs, queues, backups, licenses)                 |
| F-8   | Notifications, dashboards/charts, polish, dark mode               |

---

## 10. Non-Functional Requirements (Technical)

- **Type safety:** no `any` leaks from API responses; types come from `packages/types`.
- **Bundle size:** route-level code splitting (Next.js default); avoid heavy deps in shared layout.
- **Testing:** Vitest + React Testing Library for `packages/ui` and key features; Playwright for critical flows (login, order, approval).
- **Lint/typecheck:** enforced in CI via `pnpm lint` + `pnpm typecheck` (turbo).
- **Error handling:** global error boundary + toasts; API errors normalized to `ApiError`.
