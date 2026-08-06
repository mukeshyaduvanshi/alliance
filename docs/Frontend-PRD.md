# Frontend Product Requirements Document (Frontend PRD)

## Cjalliance Enterprise Platform — Frontend Applications

**Version:** 1.0

**Basis:** Cjalliance PRD v1.0 + TRD v1.0

**Audience:** Frontend Development Team

---

## 1. Purpose

The backend already exposes the full domain (roles, permissions, workflows, orders, brands, vendors, audit, monitoring, etc.) via the NestJS API (`/api/v1/`). This document defines **what** each frontend application must do — the pages, features, and user flows for every portal — so UI development can start against the existing backend.

---

## 2. Frontend Application Map

Five Next.js applications, one per portal, all consuming the single shared backend:

| App Directory    | Portal                | Primary Audience                             | Subdomain             |
| ---------------- | --------------------- | -------------------------------------------- | --------------------- |
| `apps/admin`     | Super Admin Portal    | Super Admin, Business Head, Department Admin | admin.cjalliance.com  |
| `apps/manager`   | KAM / Internal Portal | Operations Head, Manager, Team Leader, KAM   | kam.cjalliance.com    |
| `apps/brand`     | Brand Portal          | Brand users (self-serve)                     | brand.cjalliance.com  |
| `apps/vendor`    | Vendor Portal         | Vendor users (self-serve)                    | vendor.cjalliance.com |
| `apps/developer` | System Admin Panel    | Developers / technical staff                 | system.cjalliance.com |

Each portal has **independent login/session** but shares the backend auth service and the **same UI design system** (`packages/ui` based on shadcn/ui).

---

## 3. Common Features (All Portals)

Every portal must provide:

- **Authentication:** Login, logout, session expiry handling, refresh-token rotation (silent).
- **Dashboard:** Role-relevant KPIs, recent activity, pending items, quick actions.
- **Notification Center:** Bell icon + dropdown, unread count, mark-as-read, deep-link to entity.
- **Tenant awareness:** All data is scoped to the logged-in tenant.
- **Permission-based UI:** Hide/disable actions the user's role cannot perform (module+action).
- **Consistent shell:** Sidebar navigation, topbar (search, notifications, user menu), footer-free responsive layout.
- **Empty/loading/error states** for every data view.
- **Audit-friendly:** No client-side-only business rules; every mutation goes through backend.

---

## 4. Admin Portal (`apps/admin`)

Super Admin + internal hierarchy. **Full control over the whole platform.**

### 4.1 Auth & Onboarding

- Login (password). Super Admin may have elevated 2FA (future).
- Landing page for first-run: create tenant, seed system roles.

### 4.2 Dashboard

- Platform KPIs: total users, brands, vendors, orders, revenue.
- Pending approvals count, exception alerts, license/plan status.
- Quick actions: create user, create role, new order, approve brand.

### 4.3 User Management

- List users (search, filter by role/status, pagination).
- Create / edit / deactivate / activate users.
- Assign roles (department-wise) to users.
- Reset password, view last login.

### 4.4 Dynamic Role Management

- List roles with hierarchy tree view.
- Create / edit / delete / clone / activate / deactivate roles.
- Set role hierarchy (parent role), department.
- **Permission Matrix:** grid of Module × Action (View/Create/Edit/Delete/Approve/Reject/Export/Import/Print/Download/Share) with checkboxes per role.
- System roles are read-only protected.

### 4.5 Workflow Engine Configuration

- List workflow rules per module.
- Create/edit rule: name, module, active toggle, auto-approve, escalation hours.
- **Step builder:** ordered steps, approver role per step, optional escalation role.
- View workflow instances in-flight, approval history.

### 4.6 Brand Management

- Brand list + approval queue (approve/reject with remarks).
- Assign KAM to brand.
- Configure business model per brand (Vendor/Mediator/Hybrid + commission/markup).
- View brand details (business profile, docs, orders).

### 4.7 Vendor Management

- Vendor list + approval queue.
- Assign region-based rates (from product master) to vendors.
- View vendor performance, orders, payment status.

### 4.8 Catalog & Pricing

- Product categories CRUD.
- Product master CRUD (with images).
- Region-based rate management: default rates (brand-side) and vendor-side rates.
- Brand-specific rate overrides.

### 4.9 Purchase Orders & Orders

- PO creation for brands, budget tracking (consumed vs total).
- Order management: view all orders, status timeline, assign vendor, artwork approvals.
- Order creation with line items + rate snapshots.

### 4.10 Monitoring

- SLA rules CRUD (per status threshold).
- Exception alerts list (resolve, filter by severity).
- Audit log explorer: filters (date/user/module/action), export Excel/PDF.

### 4.11 Notifications

- System-wide notification broadcast (optional).

---

## 5. KAM / Manager Portal (`apps/manager`)

Internal team facing: Operations Head, Manager, Team Leader, KAM.

### 5.1 Dashboard

- Assigned brands, live order activity.
- Pending approvals for my role (from workflow engine).
- Exception alerts, SLA breaches, negotiation items needing response.
- Productivity metrics.

### 5.2 My Brands

- List of brands assigned to me (KAM).
- Per-brand: orders, vendors, business model, contact info.

### 5.3 Orders

- Order pipeline with status tracking.
- Create order for a brand.
- Review & respond to vendor negotiations.
- Upload artworks, trigger brand approval.

### 5.4 Approvals

- **Pending Approval Dashboard** (from workflow-instance).
- Approve / reject / escalate with remarks.
- Approval history per entity.
- Re-submission handling.

### 5.5 Vendors & Payments

- Vendor list, order status per vendor.
- Vendor performance reports & ratings.

### 5.6 SLA & Alerts

- SLA monitoring per order status.
- Exception alerts list + resolve.

---

## 6. Brand Portal (`apps/brand`)

Self-serve portal for Brands.

### 6.1 Auth & Onboarding

- Login / registration (registration → approval workflow).
- Registration: business profile (legal name, GST/PAN/CIN, address, documents).

### 6.2 Dashboard

- My orders, PO budget vs consumed, artwork pending approval, recent invoices.

### 6.3 Products & Pricing

- View my product rate card (region-based, negotiated/custom rates).

### 6.4 Orders

- Place order (against PO), upload reference/ready artwork.
- Track order status timeline.
- **Artwork approval:** approve/reject artwork with remarks.

### 6.5 POs & Invoices

- View purchase orders, budget consumed.
- Invoices & documents list/download.

### 6.6 Notifications & KAM Chat

- Notification center.
- Communicate with assigned KAM (message thread — future).

### 6.7 Reports

- Order history, spend analytics, artwork history.

---

## 7. Vendor Portal (`apps/vendor`)

Self-serve portal for Vendors.

### 7.1 Auth & Onboarding

- Login / registration → approval workflow.

### 7.2 Dashboard

- Assigned orders, production progress, upcoming delivery, payment status, ratings.

### 7.3 Orders

- View assigned orders with line items + vendor rates.
- Accept/negotiate order amount (propose negotiation).
- Update production/delivery progress.

### 7.4 Rate Card

- View my region-based rates per product.

### 7.5 Payments

- Payment status per order, payment history.

### 7.6 Performance

- My ratings, performance reports, feedback.

### 7.7 Notifications

- In-app notifications for new assignments, approvals, payments.

---

## 8. System Admin Panel (`apps/developer`)

Technical panel for developers/ops — NOT business users.

### 8.1 Dashboard

- Server health, API error rate, queue depth, storage/db usage, cache status.

### 8.2 Error Logs

- Error log explorer (level/message/path/time), stack trace view.

### 8.3 Queue & Jobs

- BullMQ queue monitoring, background jobs, retry.

### 8.4 Message Logs

- Email/SMS logs (status, failures, retry).

### 8.5 Backups

- Backup status/history, trigger backup, verify.

### 8.6 Subscriptions & Licenses

- Subscription plans CRUD.
- License management per tenant (activate/suspend/expire).

### 8.7 Cache & System

- Cache management (invalidate), system performance metrics.

---

## 9. Out of Scope (Frontend Phase 1)

- Mobile native apps (web responsive only).
- Real-time chat/messaging (KAM↔Brand) — future.
- AI-based features — future.
- White-label custom domains per brand — future.

---

## 10. Non-Functional Requirements (Frontend)

- **Performance:** Page load < 2.5s, route transitions < 300ms, image/asset optimization.
- **Responsive:** Desktop-first, functional on tablet/mobile.
- **Accessibility:** WCAG 2.1 AA where feasible (keyboard nav, focus states, aria labels).
- **Security:** No secrets in client; tokens via httpOnly cookies; sanitize all rendered data.
- **Consistency:** Single design system (shadcn/ui tokens) across all portals.
- **i18n-ready:** All strings through a central place (future translation).

---

## 11. Success Metrics (Frontend)

- Role/permission changes reflect in UI without redeploy.
- Brand/Vendor can operate without internal-team help (self-serve flows).
- Every portal shares >80% of the design-system components.
- No console errors / broken states on all key flows.
