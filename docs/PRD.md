# Product Requirements Document (PRD)

## Cjalliance Enterprise Platform

**Version:** 1.0

**Prepared for:** cjalliance

**Basis:** Developer Recommendations (Scalable Architecture Approach)

---

## 1. Overview

Cjalliance is a multi-tenant enterprise platform that connects Brands, Vendors, and the internal Cjalliance team within a single ecosystem — from the Business Head down to the Vendor, each will have their own dedicated portal, while control and visibility remain centralized with Cjalliance.

The client's current process is based on fixed roles, manual approvals, and single-domain access. The developer approach converts this into a **scalable, configurable, future-proof platform** — one where changes to business rules don't require changes to the code.

---

## 2. Objective

- Convert fixed/hardcoded business logic into **configurable systems**
- Give Brands and Vendors **independent portals**, with centralized monitoring by Cjalliance
- Build a scalable **role, permission, and workflow management** system that adapts as the business grows
- Ensure a complete **audit trail and security**

---

## 3. User Roles & Hierarchy

### 3.1 Dynamic Role Management System

Using the predefined roles (Business Head, Operations Head, Operations Manager, KAM) as a starting point, the system will include **Dynamic Role Management**, where the Super Admin can:

- Create/edit/delete unlimited custom roles
- Define role hierarchy
- Clone existing roles
- Activate/deactivate roles
- Assign roles department-wise

**Reason:** As the organization grows, roles will grow too — without needing new development.

### 3.2 Suggested Admin Hierarchy

```
Super Admin (Company Owner)
  └── Business Head
        └── Department Admin
              └── Operations Head
                    └── Manager
                          └── Team Leader
```

The Super Admin will have unrestricted access — over users, permissions, configurations, and business operations.

---

## 4. Permission Management System

Instead of fixed responsibilities, there will be a **module-wise and action-wise configurable permission system**.

**Actions per module:**

View · Create · Edit · Delete · Approve · Reject · Export · Import · Print · Download · Share

The Admin can modify any role's permissions at any time without code changes — as business processes evolve, the platform evolves with them.

---

## 5. Approval Workflow Engine

Instead of a hardcoded senior-approval process, a **Configurable Workflow Engine** will be built, allowing the Admin to define their own rules:

- Single-Level Approval
- Multi-Level Approval
- Department-wise Approval
- Auto Approval Rules
- Manual Approval
- Approval Escalation
- Approval History
- Pending Approval Dashboard
- Rejection with Remarks
- Re-Submission Workflow

---

## 6. Vendor Management

Vendors will get their own **dedicated Vendor Portal** so they can manage their assigned orders independently, while Cjalliance retains complete visibility over pricing, production, quality, and delivery.

**Vendor Portal Features:**

- Vendor Dashboard
- Order Assignment
- Vendor Performance Reports & Rating System
- Vendor Payment Status
- Vendor-wise Analytics
- Production Progress & Delivery Tracking
- Vendor ↔ Cjalliance Communication

---

## 7. Brand Management

Brands are currently dependent on Cjalliance employees. In the developer approach, Brands will get their own **dedicated Brand Portal** — for independent operations, while remaining connected to Cjalliance for monitoring.

**Brand Portal Features:**

- Brand Dashboard
- Brand User Management
- Product & Order Management
- Artwork Approval
- Reports & Analytics
- Notification Center
- Document & Invoice Management
- Communication with KAM

**Impact:** Reduces operational dependency on Cjalliance and improves efficiency.

---

## 8. Centralized Monitoring (Brands & Vendors)

Brands and Vendors will operate independently, but Cjalliance will retain full visibility through centralized dashboards:

- Live Activity Monitoring
- Real-Time Order Tracking
- Audit Logs
- KAM Dashboard & Performance Dashboard
- Issue Escalation
- SLA Monitoring
- Exception Alerts
- Productivity Reports

**Result:** Operational independence + centralized control — together.

---

## 9. Developer / Admin (System) Panel

Instead of manual server/platform management, a dedicated **technical Admin Panel** will be built:

- Server Health Monitoring
- Subscription & License Management
- API Monitoring & Error Logs
- Queue Monitoring
- Storage & Database Monitoring
- Email/SMS/Notification Logs
- Background Jobs
- Cache Management
- Backup Status
- System Performance Dashboard

**Impact:** Significantly reduces manual maintenance and improves reliability.

---

## 10. Platform Architecture

### 10.1 Multi-Domain / Multi-Subdomain Structure

Instead of single-domain access, a multi-subdomain architecture for scalability and security:

```
admin.cjalliance.com
brand.cjalliance.com
vendor.cjalliance.com
kam.cjalliance.com
api.cjalliance.com
```

**Supporting capabilities:**

- Multi-Tenant Architecture with Tenant Isolation
- Independent Authentication & Deployment per portal
- Centralized API Gateway
- Shared Database with Tenant Separation
- White Label Branding
- Better Security & Performance
- A failure in one portal won't affect the others

### 10.2 Suggested Tech Stack (aligned with proven stack)

- **Frontend:** Next.js (multiple role-based apps — Turborepo monorepo pattern)
- **Backend:** NestJS (modular, RBAC-ready)
- **Database:** PostgreSQL (Supabase) with tenant-level separation
- **Cache/Queue:** Redis
- **Storage:** Cloudflare R2 (documents, artwork, assets)
- **Deployment:** Backend — Railway; Frontends — Vercel

---

## 11. Business Model Flexibility

Instead of Cjalliance's fixed service-provider role, the platform will support multiple business models:

- **Vendor Model**
- **Mediator Model**
- **Hybrid Model**

The Admin will be able to configure the operational model individually for each Brand — no redevelopment needed when the future strategy changes.

---

## 12. Audit Logs & Security

Instead of logging only for internal users, comprehensive audit logging for **all users** (internal, Brand, Vendor, Client, Admin):

**Tracked Data:**

Login/Logout History · IP Address · Device & Browser Info · Location (optional) · Session Duration · Every CRUD Operation · Approval History · Status Changes · File Upload/Download · Data Exports · Failed Login Attempts · Password Changes · Permission Changes · User Creation/Deletion · Security Events

**Audit Log Capabilities:**

- Date/User/Module Filters
- Export to Excel/PDF
- Search Functionality
- Long-Term Log Retention

---

## 13. Non-Functional Requirements

| Category     | Requirement                                        |
| ------------ | -------------------------------------------------- |
| Scalability  | Multi-tenant, horizontally scalable architecture   |
| Security     | RBAC, audit logs, tenant isolation, encrypted data |
| Availability | Independent portal deployment (isolated failures)  |
| Performance  | Redis caching, optimized queries, CDN for assets   |
| Compliance   | Full activity traceability for audits              |

---

## 14. Assumptions

- The client is moving from the fixed process (Answer A) to the scalable model (Answer B)
- Each Brand/Vendor will have its own login/authentication
- The Super Admin will remain with Cjalliance, with full control

---

## 15. Out of Scope (Phase 1)

- Mobile app development (unless specified separately)
- Third-party marketplace integrations (until confirmed)
- AI-based automation features (future phase)

---

## 16. Success Metrics

- Role/permission changes can be made without developer involvement
- Brand/Vendor operational dependency on Cjalliance reduced by 50%+
- Full audit trail available for every critical action
- Platform runs stably across multiple domains/subdomains
