# Frontend Browser Testing Guide

> Har portal ko browser mein kaise test karein — step by step.
> Version: 1.0 (App shells + auth flows)

---

## 1. Before You Start (Prerequisites)

### 1.1 Backend chahiye
Frontend backend (`localhost:4000`) ke bina kaam nahi karega. Backend chalana:

```bash
pnpm --filter backend start:dev
```

Backend sahi chala to ye dikhega:
```
Mapped {/api/v1/auth/login, POST} route ...
Nest application successfully started
```

> ⚠️ **Agar DB error aaye** (`ENOTFOUND tenant/user ... not found`) → Supabase project paused/deleted hai.
> Fix: https://supabase.com/dashboard se project restart karo, ya `packages/database/.env` mein naya connection string daalo.

### 1.2 DB seed karo (pehli baar)
Super Admin account banane ke liye:

```bash
pnpm --filter @database/database seed
```

Isse ye banta hai:
- Tenant: **colorjet**
- Super Admin user: `admin@colorjet.com` / `Admin@123`
- System roles + saare module permissions

### 1.3 Saare portals ek saath (alag ports)

Har app default port **3000** maangta hai, isliye **ek time par ek** chalao ya alag ports do:

| Portal | Command | URL |
|--------|---------|-----|
| Admin | `pnpm --filter admin dev` | http://localhost:3000 |
| Manager | `pnpm --filter manager dev -p 3001` | http://localhost:3001 |
| Brand | `pnpm --filter brand dev -p 3002` | http://localhost:3002 |
| Vendor | `pnpm --filter vendor dev -p 3003` | http://localhost:3003 |
| Developer | `pnpm --filter developer dev -p 3004` | http://localhost:3004 |

> Note: `-p` port Next.js ko batata hai. Har terminal mein ek command chalao.

---

## 2. Quick Smoke Test (Har Portal)

Har portal par ye basic checks karo:

| # | Check | Kya dikhna chahiye |
|---|-------|--------------------|
| 1 | `/login` page khulo | Centered login card, email + password fields |
| 2 | Blank submit karo | Validation errors dikhein (Email required etc.) |
| 3 | Galat password | Red toast: login failed message |
| 4 | Sahi credentials | Login success, `/` dashboard par redirect |
| 5 | Sidebar | Portal ke nav items dikhein |
| 6 | Theme toggle (sun/moon icon) | Dark/light mode switch ho |
| 7 | Bell icon click | Notifications dropdown (khali → "No notifications") |
| 8 | User menu → Logout | Back to `/login` |

---

## 3. Portal-by-Portal Test

### 3.1 Admin Portal (http://localhost:3000)

**Login credentials (seed):**
```
Email:    admin@colorjet.com
Password: Admin@123
```

**Test steps:**
1. `/login` → sahi credentials se login karo
2. Redirect to `/` (Dashboard) — 4 placeholder stat cards dikhne chahiye
3. Sidebar mein ye sections dikhne chahiye:
   - Dashboard, Users, Roles & Permissions, Workflows, Brands, Vendors,
     Catalog & Pricing, Purchase Orders, Orders, Monitoring, Audit Logs
4. **Logout** → `/login` par wapas
5. Bina login ke `/users` kholo → `/login` par redirect ho jaye

---

### 3.2 Manager Portal (http://localhost:3001)

**Login credentials (same internal user):**
```
Email:    admin@colorjet.com
Password: Admin@123
```

**Test steps:**
1. Login → Dashboard (4 placeholder stat cards)
2. Sidebar: My Brands, Orders, Approvals, Vendors, SLA & Alerts, Notifications
3. Logout test + redirect test (bina login `/approvals` → `/login`)

---

### 3.3 Brand Portal (http://localhost:3002)

Brand ke paas **seed se koi user nahi** hai — do flow test karo:

**Flow A — Registration:**
1. `/register` kholo
2. Form bharo (saare required fields):
   - Brand Name, Contact Person, Phone (10-digit), Email, Password
   - Business Profile: Legal Name, Business Type, Address, City, State, Pincode
3. Optional: GSTIN (`27AAAAA0000A1Z5` pattern), PAN (`AAAAA0000A`)
4. Submit → toast: "Registration submitted! Your account is pending approval."
5. Backend DB mein brand `PENDING` status par bana hoga (admin portal se approve kar sakte ho)

**Flow B — Login (registration approve hone ke baad):**
1. Admin portal se brand approve karo (backend API: `POST /api/v1/brands/:id/approve`)
2. `/login` par registered email + password se login
3. Dashboard + sidebar: Products & Pricing, Orders, Purchase Orders, Invoices

---

### 3.4 Vendor Portal (http://localhost:3003)

Vendor ke paas bhi seed user nahi — same 2 flows:

**Flow A — Registration:**
1. `/register` → vendor form bharo (same pattern as brand)
2. Submit → "pending approval" toast

**Flow B — Login:**
1. Admin se vendor approve (`POST /api/v1/vendors/:id/approve`)
2. `/login` → dashboard + sidebar: Orders, Rate Card, Payments, Performance

---

### 3.5 Developer Panel (http://localhost:3004)

**Login credentials (internal user):**
```
Email:    admin@colorjet.com
Password: Admin@123
```

**Test steps:**
1. Login → Dashboard (server status, error rate, queued jobs)
2. Sidebar: Server Health, Error Logs, Queues & Jobs, Message Logs, Backups, Subscriptions, Cache & Storage
3. Logout test

---

## 4. Full API Round-Trip Test (Advanced)

Frontend abhi placeholders hai, isliye full data flow **API se** verify karo:

| # | Action | Method + Endpoint | Body (partial) |
|---|--------|-------------------|----------------|
| 1 | Admin login | `POST /api/v1/auth/login` | `{ "email": "admin@colorjet.com", "password": "Admin@123" }` |
| 2 | Brand register | `POST /api/v1/brand-registration` | `{ brandName, email, password, legalName, businessType, addressLine1, city, state, pincode }` |
| 3 | Brand approve | `POST /api/v1/brands/:id/approve` | Bearer token |
| 4 | Vendor register | `POST /api/v1/vendor-registration` | `{ vendorName, email, password, legalName, ... }` |
| 5 | Vendor approve | `POST /api/v1/vendors/:id/approve` | Bearer token |
| 6 | Brand login | `POST /api/v1/brand-auth/login` | `{ email, password }` |
| 7 | Vendor login | `POST /api/v1/vendor-auth/login` | `{ email, password }` |

API tool: Postman/Bruno/curl. Base URL: `http://localhost:4000/api/v1`

---

## 5. Common Issues & Fixes

| Issue | Reason | Fix |
|-------|--------|-----|
| Login se "Login failed" | Backend down | `pnpm --filter backend start:dev` chalao |
| `ENOTFOUND tenant/user` DB error | Supabase paused/deleted | Restart project ya naya URL `packages/database/.env` mein |
| Port 3000 already in use | Do app ek hi port par | `-p` flag se alag port do |
| Page `/users` par redirect | Session cookie missing | Pehle login karo |
| Register ke baad login nahi | Brand/Vendor PENDING hai | Admin se approve karo |
| Backend slow/query error | DB down ya seed nahi hua | `pnpm --filter @database/database seed` chalao |

---

## 6. Test Checklist (Copy-paste karne layak)

```
[ ] Backend chala (`pnpm --filter backend start:dev`)
[ ] Seed chala (pehli baar)
[ ] Admin: login admin@colorjet.com / Admin@123
[ ] Admin: dashboard + sidebar render
[ ] Admin: unauth redirect (/users → /login)
[ ] Manager: login + dashboard + logout
[ ] Brand: register flow → pending toast
[ ] Brand: login (approve ke baad)
[ ] Vendor: register flow → pending toast
[ ] Vendor: login (approve ke baad)
[ ] Developer: login + dashboard + logout
[ ] Har portal: theme toggle, bell, logout, redirect
```

---

## 7. Abhi Kya Test Nahi Hota (Placeholders)

Ye modules abhi UI mein **placeholder** hain (backend API ready hai):
- Dashboard stat cards (hardcoded "—")
- Users/Roles/Permissions/Workflow pages
- Brand/Vendor/Order/Product list pages
- Developer error-logs/queues/backups pages

Inke sahi data ke liye backend modules ko frontend se connect karna hai — wo **Phase F-3+** mein hoga.
