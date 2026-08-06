# Technical Requirements Document (TRD)

## ColorJet Enterprise Platform

**Version:** 1.0

**Based on:** ColorJet PRD v1.0

**Audience:** Development Team

---

## 1. Purpose

This document translates the PRD into a technical blueprint — architecture, tech stack, module breakdown, database design approach, API strategy, and deployment plan — so development can begin with a clear, unambiguous structure.

Detailed Prisma schemas for each module will be built as separate follow-up documents (module-wise), referenced in Section 8.

---

## 2. System Architecture Overview

ColorJet will be built as a **multi-tenant, multi-portal monorepo platform**, with each user type (Super Admin, Brand, Vendor, KAM/Internal team) accessing its own dedicated frontend app, all backed by a single shared NestJS backend via a centralized API Gateway pattern.

```
                         ┌─────────────────────┐
                         │   api.colorjet.com   │
                         │  (NestJS Backend)    │
                         └──────────┬───────────┘
                                    │
        ┌───────────┬──────────────┼──────────────┬────────────┐
        │            │              │              │            │
  admin.colorjet  brand.colorjet vendor.colorjet kam.colorjet  (future apps)
   (Super Admin)     (Brand)       (Vendor)      (Internal Team)
        │            │              │              │
        └────────────┴──────────────┴──────────────┘
                          │
                 ┌────────┴────────┐
                 │   PostgreSQL     │  (Supabase, tenant-isolated)
                 │   + Redis Cache  │
                 │   + Cloudflare R2│
                 └──────────────────┘
```

**Key architectural principles:**

- Single backend, multiple frontend apps (similar pattern to the Hotel SaaS monorepo — admin/customer/kitchen/etc. structure)
- Shared core packages (UI components, types, utils) across all frontend apps
- Tenant isolation enforced at the database + middleware level, not per-app
- Stateless backend, horizontally scalable

---

## 3. Tech Stack

| Layer              | Technology                                       | Notes                                   |
| ------------------ | ------------------------------------------------ | --------------------------------------- |
| Monorepo           | Turborepo + pnpm                                 | Matches existing proven pattern         |
| Frontend           | Next.js 15 (App Router)                          | Separate app per portal                 |
| Backend            | NestJS                                           | Modular, RBAC-friendly, DI-based        |
| ORM                | Prisma 6                                         | Shared schema, tenant-scoped queries    |
| Database           | PostgreSQL (Supabase)                            | Row-level tenant isolation              |
| Cache/Queue        | Redis (Upstash or self-hosted)                   | Sessions, rate-limiting, BullMQ jobs    |
| File Storage       | Cloudflare R2                                    | Artwork, documents, invoices            |
| Auth               | JWT + Refresh Tokens (custom or Supabase Auth)   | Per-portal independent sessions         |
| Notifications      | Fast2SMS / Email (Resend) / In-app               | Based on existing integrations          |
| Payments/Invoicing | Existing gateway pattern (if applicable)         | To confirm with client                  |
| Background Jobs    | BullMQ + Redis                                   | Approval escalations, report generation |
| Deployment         | Backend → Railway, Frontends → Vercel            | Matches existing deployment pattern     |
| Monitoring         | Custom Admin Panel + external tool (e.g. Sentry) | Error logs, API monitoring              |

---

## 4. Multi-Tenant Strategy

**Approach:** Shared database, tenant-isolated via `tenantId` (or `organizationId`) foreign key across all core tables — same pattern proven in the Hotel SaaS multi-branch model.

- Every table with tenant-specific data includes a `tenantId` column
- Prisma middleware / NestJS interceptor auto-injects tenant scoping on every query
- Each subdomain (`brand.colorjet.com`, `vendor.colorjet.com`) resolves its tenant context at request time via subdomain or JWT claim
- Super Admin queries bypass tenant scoping (global access)

This avoids the operational overhead of separate databases per tenant while still ensuring strict data isolation.

---

## 5. Application Breakdown (Monorepo Apps)

Following the same multi-app pattern used in the Hotel SaaS project:

```
apps/
  ├── admin/          → Super Admin + internal hierarchy (Business Head, Ops Head, etc.)
  ├── brand/           → Brand Portal
  ├── vendor/          → Vendor Portal
  ├── kam/            → KAM / Internal team-facing app
  └── system-admin/    → Developer/Admin technical panel

backend/
  └── api/             → NestJS backend (single service, modular)

packages/
  ├── ui/               → Shared shadcn/ui components
  ├── types/           → Shared TypeScript types/interfaces
  ├── config/           → Shared eslint/tsconfig
  └── utils/            → Shared helpers (formatters, validators)
```

---

## 6. Module Breakdown

Each module below will get its own detailed Prisma schema + API spec as a follow-up document.

| #   | Module                        | Core Responsibility                                           |
| --- | ----------------------------- | ------------------------------------------------------------- |
| 1   | **Core / Tenant & User**      | Tenant setup, user accounts, authentication                   |
| 2   | **Dynamic Role & Permission** | Role CRUD, permission matrix, module/action-based access      |
| 3   | **Workflow Engine**           | Configurable approval chains, escalation, history             |
| 4   | **Brand Portal**              | Brand dashboard, products, orders, artwork approval, invoices |
| 5   | **Vendor Portal**             | Vendor dashboard, order assignment, performance, payments     |
| 6   | **Monitoring & Analytics**    | KAM dashboard, SLA monitoring, exception alerts               |
| 7   | **System Admin Panel**        | Server health, logs, queues, backups, subscriptions           |
| 8   | **Audit Log System**          | Universal activity logging across all modules                 |
| 9   | **Notification System**       | Email/SMS/in-app notifications, templates                     |
| 10  | **Business Model Config**     | Vendor/Mediator/Hybrid model per-brand configuration          |

---

## 7. API Design Approach

- **Style:** REST (NestJS controllers), versioned under `/api/v1/`
- **Auth:** JWT access token (short-lived) + refresh token (httpOnly cookie), separate auth context per portal
- **Authorization:** Guard-based RBAC — a custom `PermissionsGuard` checks `module:action` against the user's role permissions on every protected route
- **Tenant Scoping:** Global NestJS interceptor injects `tenantId` from JWT into every Prisma query context
- **Validation:** DTOs with `class-validator`, consistent with existing pattern
- **Error Handling:** Centralized exception filter, standardized error response shape
- **Rate Limiting:** Redis-backed throttling per IP/user for sensitive endpoints (login, exports)

---

## 8. Database Design Approach

Full Prisma schema will be delivered **module-wise** (as agreed) in this order:

1. Core (Tenant, User, Role, Permission, RolePermission)
2. Workflow Engine (WorkflowRule, ApprovalStep, ApprovalHistory)
3. Brand Portal (Brand, Product, Order, Artwork, Invoice)
4. Vendor Portal (Vendor, VendorOrder, VendorPerformance, VendorPayment)
5. Audit Logs (AuditLog — polymorphic, tenant + user + action + module)
6. System Admin (SubscriptionPlan, License, SystemLog)

**High-level entity relationship (conceptual, not final):**

```
Tenant ──< User >── Role ──< RolePermission >── Permission
  │
  ├──< Brand ──< Order ──< OrderItem
  │        └──< Artwork
  │
  ├──< Vendor ──< VendorOrder
  │
  ├──< WorkflowRule ──< ApprovalStep
  │
  └──< AuditLog
```

**Known patterns to carry forward (from prior projects):**

- `Json` fields in Prisma → return type `Promise<any>` in monorepo shared packages
- Soft deletes (`deletedAt`) instead of hard deletes on critical tables
- Composite indexes on `(tenantId, createdAt)` for performant tenant-scoped queries
- Cursor-based pagination for large datasets (orders, audit logs)

---

## 9. Authentication & Authorization Strategy

- Each portal (`admin`, `brand`, `vendor`, `kam`) has **independent login/session** but shares the same backend auth service
- OTP-based or password-based login (to confirm per portal — Vendors/Brands may need simpler onboarding)
- Role + Permission resolved on login, cached in Redis for fast lookup, invalidated on permission change
- Super Admin has a separate elevated auth flow (optional 2FA recommended)

---

## 10. Security Considerations

- Tenant isolation enforced at query layer (never trust client-supplied tenantId directly — derive from JWT)
- All actions logged via Audit Log module (Section 6, #8)
- Sensitive endpoints rate-limited
- File uploads (artwork, invoices) validated for type/size before R2 upload
- Encrypted storage for sensitive fields (payment details, if stored)
- Regular backup verification via System Admin Panel

---

## 11. Deployment Architecture

| Component                                              | Platform                                           |
| ------------------------------------------------------ | -------------------------------------------------- |
| NestJS Backend                                         | Railway                                            |
| Next.js Apps (admin, brand, vendor, kam, system-admin) | Vercel (separate projects per subdomain)           |
| Database                                               | Supabase (PostgreSQL)                              |
| Redis                                                  | Upstash                                            |
| File Storage                                           | Cloudflare R2                                      |
| CI/CD                                                  | GitHub Actions (lint, build, test, deploy per app) |

---

## 12. Development Phases (Suggested)

| Phase   | Scope                                                         |
| ------- | ------------------------------------------------------------- |
| Phase 1 | Core module: Tenant, User, Role, Permission, Auth             |
| Phase 2 | Workflow Engine + Audit Logs (foundation for everything else) |
| Phase 3 | Brand Portal                                                  |
| Phase 4 | Vendor Portal                                                 |
| Phase 5 | System Admin Panel + Monitoring dashboards                    |
| Phase 6 | Business Model Config + Notifications + polish                |

This sequencing ensures RBAC and audit logging (used by every other module) are built first, avoiding rework later.

---

## 13. Non-Functional Requirements (Technical)

- **Scalability:** Stateless backend, horizontal scaling on Railway, Redis for shared session/cache state
- **Performance:** Target API response < 300ms for standard CRUD, cursor pagination for large tables
- **Reliability:** Automated backups, health-check endpoints for System Admin Panel
- **Maintainability:** Shared types package to avoid frontend/backend contract drift
- **Testability:** Unit tests for permission-guard logic and workflow engine (highest business-risk areas)

---

## 14. Open Questions (Need Client/Team Confirmation)

- Payment gateway for Brand/Vendor transactions (if any) — which provider?
- OTP vs password login for Brand/Vendor portals?
- Expected initial scale (number of tenants, concurrent users) — affects infra sizing
- Does "White Label Branding" (from PRD) mean custom domains per Brand, or just logo/theme customization?

---
