# Manager Permission-Based Access & Brand Scoping — Analysis & Plan

> **Status: IMPLEMENTED & TESTED ✅** (2026-08-12)

## 1. Objective

Manager (KAM) ko **sirf wahi power** mile jo admin ne roles/permissions me di hai:

- `brand:VIEW` → brand dekh sakta hai
- `brand:APPROVE` → approve button + API allow
- `brand:REJECT` → reject button + API allow
- Permission remove karo → button turant gayab (UI) + API 403 (backend)
- Brand access sirf **assigned brands** tak limited (detail + approve/reject)

## 2. Current State (Analysis)

### 2.1 Backend permission check — ✅ Already enforced

`apps/backend/src/modules/brand/brand.controller.ts`:
- `POST /brands/:id/approve` → `@RequirePermission('brand', 'APPROVE')`
- `POST /brands/:id/reject` → `@RequirePermission('brand', 'REJECT')`
- `GET /brands/:id` → `@RequirePermission('brand', 'VIEW')`

`PermissionsGuard` (`auth/guards/permissions.guard.ts`) DB se `rolePermission` check karta hai.
Admin (`isAdmin`) bypass karta hai. Yani **backend API level par permission enforcement already theek hai**.

### 2.2 Workflow step role check — ✅ Already enforced

`apps/backend/src/modules/workflow-instance/workflow-instance.service.ts`:
- Line 192: `approve()` → `if (currentStep.approverRoleId !== userRoleId) throw ForbiddenException`
- Line 236: `reject()` → same check

Matlab: `brand:APPROVE` permission hone par bhi, agar workflow rule ke step ka approver role manager ke role se match nahi karta → Forbidden.

### 2.3 Manager UI — ✅ Done

`apps/manager/features/brands/brand-detail.tsx` + `queries.ts`:
- ✅ `useApproveBrand` / `useRejectBrand` mutations added
- ✅ `BrandApprovalDialog` (remarks ke sath confirm)
- ✅ Approve/Reject buttons `canApprove`/`canReject` permission-checked:
  ```ts
  const canApprove = usePermission("brand", "APPROVE");
  const canReject = usePermission("brand", "REJECT");
  ```
- ✅ Buttons sirf `approvalStatus === "PENDING"` par dikhte hain
- ✅ Brand access assigned brands tak scoped

### 2.4 Brand access scoping — ✅ Done

`apps/backend/src/modules/brand/brand.service.ts`:
- `findAll()` → manager ko sirf assigned brands return
- `findOne()` → non-assigned brand par 403
- `approve()`/`reject()` → non-assigned brand par 403
- Admin (`isAdmin`) → bypass (sab kuch)
- `getAssignedBrandIds()` → BrandAssignment + assignedKamId dono se collect

## 3. Planned Changes

### 3.1 Brand scoping (backend) — ✅ Done

`brand.service.ts` — `findAll`/`findOne`/`approve`/`reject`:
- findAll: `id: { in: assignedIds }` filter (non-admin)
- findOne/approve/reject: `ForbiddenException` agar id assigned nahi
- Admin bypass via `isAdmin`

### 3.2 Manager UI — ✅ Done

- ✅ Approve/Reject buttons permission-based
- My Brands page filtered (assigned brands)
- Brand detail tab PO/Orders assigned brand tak

### 3.3 Permission remove → button gayab — ✅ (by design, re-login required)

- UI: `usePermission` session se → permission remove + re-login → button gayab
- Backend: PermissionsGuard → 403

## 4. Behavior Matrix (TESTED ✅)

| Scenario | UI button | API | Tested |
| --- | --- | --- | --- |
| Manager: `brand:APPROVE` + assigned + rule role match | ✅ | ✅ 200 | ✅ |
| Manager: assigned brand detail | ✅ | ✅ 200 | ✅ (d5014499) |
| Manager: non-assigned brand detail | ✅ button dikhega | ❌ 403 | ✅ (brand-seed-1 → 403) |
| Manager: non-assigned approve | ✅ | ❌ 403 | ✅ (brand-seed-1 → 403) |
| Manager: `brand:REJECT` hata diya | ❌ button nahi | ❌ 403 | by-design |
| Manager: rule approver role ≠ manager role | ✅ button | ❌ 403 | by-design |
| Manager: findAll | sirf assigned | sirf assigned | ✅ (3/4 brands) |
| Admin | ✅ sab | ✅ sab | ✅ (4/4 brands) |

## 5. Risk & Notes

- **Role match restriction:** Manager approve button dikhega, par agar workflow rule ke step
  me manager ka role approver nahi hai → backend Forbidden. Admin ko rule create karte waqt
  approver role = manager role rakhna chahiye.
- **Re-login:** Permission change ke baad manager ko re-login karna hoga (session-based).
- **Session portal bug:** `getSession()` raw export tha — fixed (admin/manager/brand/vendor).
- **Backend process:** scoping test ke liye backend force-restart karna pada — nest watch
  purana dist par atak gaya tha.

## 6. Files Touched (Implemented)

| File | Change |
| --- | --- |
| `apps/backend/src/modules/brand/brand.service.ts` | Brand scoping (findAll/findOne/approve/reject) + `getAssignedBrandIds` |
| `apps/backend/src/modules/brand/brand.controller.ts` | userId/isAdmin params pass |
| `apps/manager/features/brands/brand-detail.tsx` | Approve/Reject UI + dialog (permission-based) |
| `apps/manager/features/brands/queries.ts` | useApproveBrand / useRejectBrand |
| `apps/manager/lib/session.ts` | getSession PORTAL-bound fix |
| `apps/admin/lib/session.ts` | getSession PORTAL-bound fix |
| `apps/brand/lib/session.ts` | getSession PORTAL-bound fix |
| `apps/vendor/lib/session.ts` | getSession PORTAL-bound fix |
| `apps/backend/src/common/filters/global-exception.filter.ts` | 4xx log to WARN (not ERROR) |
