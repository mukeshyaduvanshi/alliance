# Module 1: Core

## Tenant, User, Role & Permission Management

**Platform:** ColorJet Enterprise
**Stack:** NestJS + Prisma + PostgreSQL + Redis

---

## 1. Scope

This module covers the foundation every other module depends on:

- Tenant (organization) setup
- User accounts & authentication
- Dynamic Role management
- Module/action-based Permission system
- Role ↔ Permission mapping

---

## 2. Prisma Schema

```prisma
// ============================
// ENUMS
// ============================

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum RoleStatus {
  ACTIVE
  INACTIVE
}

enum PermissionAction {
  VIEW
  CREATE
  EDIT
  DELETE
  APPROVE
  REJECT
  EXPORT
  IMPORT
  PRINT
  DOWNLOAD
  SHARE
}

// ============================
// TENANT
// ============================

model Tenant {
  id            String   @id @default(uuid())
  name          String
  slug          String   @unique
  subdomain     String   @unique
  logoUrl       String?  @map("logo_url")
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  users         User[]
  roles         Role[]

  @@map("tenants")
}

// ============================
// USER
// ============================

model User {
  id            String     @id @default(uuid())
  tenantId      String     @map("tenant_id")
  roleId        String     @map("role_id")

  fullName      String     @map("full_name")
  email         String
  phone         String?
  passwordHash  String?    @map("password_hash")

  status        UserStatus @default(ACTIVE)
  isAdmin  Boolean    @default(false) @map("is_super_admin")

  lastLoginAt   DateTime?  @map("last_login_at")
  createdAt     DateTime   @default(now()) @map("created_at")
  updatedAt     DateTime   @updatedAt @map("updated_at")
  deletedAt     DateTime?  @map("deleted_at")

  tenant        Tenant     @relation(fields: [tenantId], references: [id])
  role          Role       @relation(fields: [roleId], references: [id])
  refreshTokens RefreshToken[]

  @@unique([tenantId, email])
  @@index([tenantId, status])
  @@map("users")
}

// ============================
// ROLE (Dynamic Role Management)
// ============================

model Role {
  id            String      @id @default(uuid())
  tenantId      String      @map("tenant_id")
  parentRoleId  String?     @map("parent_role_id")   // for role hierarchy

  name          String
  description   String?
  department    String?
  status        RoleStatus  @default(ACTIVE)
  isSystemRole  Boolean     @default(false) @map("is_system_role") // prevents deletion of core roles

  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")
  deletedAt     DateTime?   @map("deleted_at")

  tenant            Tenant           @relation(fields: [tenantId], references: [id])
  parentRole        Role?            @relation("RoleHierarchy", fields: [parentRoleId], references: [id])
  childRoles        Role[]           @relation("RoleHierarchy")
  users             User[]
  rolePermissions   RolePermission[]

  @@unique([tenantId, name])
  @@index([tenantId, status])
  @@map("roles")
}

// ============================
// PERMISSION (Module + Action based)
// ============================

model Permission {
  id            String            @id @default(uuid())
  module        String            // e.g. "brand_orders", "vendor_portal", "audit_logs"
  action        PermissionAction
  label         String            // human-readable, e.g. "Approve Brand Orders"

  createdAt     DateTime          @default(now()) @map("created_at")

  rolePermissions RolePermission[]

  @@unique([module, action])
  @@map("permissions")
}

// ============================
// ROLE_PERMISSION (Join Table)
// ============================

model RolePermission {
  id            String     @id @default(uuid())
  roleId        String     @map("role_id")
  permissionId  String     @map("permission_id")

  createdAt     DateTime   @default(now()) @map("created_at")

  role          Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission    Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@map("role_permissions")
}

// ============================
// REFRESH TOKEN
// ============================

model RefreshToken {
  id            String    @id @default(uuid())
  userId        String    @map("user_id")
  tokenHash     String    @map("token_hash")
  expiresAt     DateTime  @map("expires_at")
  revokedAt     DateTime? @map("revoked_at")
  createdAt     DateTime  @default(now()) @map("created_at")

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("refresh_tokens")
}
```

**Design notes:**

- `Role.parentRoleId` (self-relation) gives hierarchy support directly — no separate hierarchy table needed
- `Role.isSystemRole` prevents Admin from accidentally deleting critical default roles
- `Permission` is **global** (not tenant-scoped) since module/action combinations are platform-defined; only `RolePermission` mapping is tenant-scoped (via the Role)
- Soft delete (`deletedAt`) on Tenant/User/Role — matches your existing pattern, avoids breaking historical audit/order references
- `User.isAdmin` flag bypasses permission checks entirely in the guard (see Section 4)

---

## 3. API Endpoints

### 3.1 Auth

| Method | Endpoint                       | Description                  |
| ------ | ------------------------------ | ---------------------------- |
| POST   | `/api/v1/auth/login`           | Email/phone + password login |
| POST   | `/api/v1/auth/refresh`         | Refresh access token         |
| POST   | `/api/v1/auth/logout`          | Revoke refresh token         |
| POST   | `/api/v1/auth/forgot-password` | Send reset link/OTP          |
| POST   | `/api/v1/auth/reset-password`  | Reset password with token    |

### 3.2 Tenant (Admin only)

| Method | Endpoint              | Description        |
| ------ | --------------------- | ------------------ |
| GET    | `/api/v1/tenants`     | List all tenants   |
| POST   | `/api/v1/tenants`     | Create new tenant  |
| GET    | `/api/v1/tenants/:id` | Get tenant details |
| PATCH  | `/api/v1/tenants/:id` | Update tenant      |
| DELETE | `/api/v1/tenants/:id` | Soft-delete tenant |

### 3.3 User

| Method | Endpoint                   | Description                           |
| ------ | -------------------------- | ------------------------------------- |
| GET    | `/api/v1/users`            | List users (tenant-scoped, paginated) |
| POST   | `/api/v1/users`            | Create user                           |
| GET    | `/api/v1/users/:id`        | Get user details                      |
| PATCH  | `/api/v1/users/:id`        | Update user                           |
| DELETE | `/api/v1/users/:id`        | Soft-delete / deactivate user         |
| PATCH  | `/api/v1/users/:id/status` | Activate/Suspend user                 |

### 3.4 Role

| Method | Endpoint                   | Description                             |
| ------ | -------------------------- | --------------------------------------- |
| GET    | `/api/v1/roles`            | List roles (tenant-scoped)              |
| POST   | `/api/v1/roles`            | Create custom role                      |
| GET    | `/api/v1/roles/:id`        | Get role details + permissions          |
| PATCH  | `/api/v1/roles/:id`        | Update role                             |
| DELETE | `/api/v1/roles/:id`        | Delete role (blocked if `isSystemRole`) |
| POST   | `/api/v1/roles/:id/clone`  | Clone role with its permissions         |
| PATCH  | `/api/v1/roles/:id/status` | Activate/Deactivate role                |

### 3.5 Permission

| Method | Endpoint                        | Description                                        |
| ------ | ------------------------------- | -------------------------------------------------- |
| GET    | `/api/v1/permissions`           | List all available permissions (grouped by module) |
| GET    | `/api/v1/roles/:id/permissions` | Get permissions assigned to a role                 |
| PUT    | `/api/v1/roles/:id/permissions` | Bulk update role's permissions (replace set)       |

---

## 4. NestJS Module Structure

```
backend/api/src/
  modules/
    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts
      guards/
        jwt-auth.guard.ts
        permissions.guard.ts        ← checks module:action against user's role
      strategies/
        jwt.strategy.ts
      decorators/
        require-permission.decorator.ts   ← @RequirePermission('brand_orders', 'APPROVE')
        current-user.decorator.ts

    tenant/
      tenant.module.ts
      tenant.controller.ts
      tenant.service.ts
      dto/
        create-tenant.dto.ts
        update-tenant.dto.ts

    user/
      user.module.ts
      user.controller.ts
      user.service.ts
      dto/
        create-user.dto.ts
        update-user.dto.ts

    role/
      role.module.ts
      role.controller.ts
      role.service.ts
      dto/
        create-role.dto.ts
        update-role.dto.ts
        assign-permissions.dto.ts

    permission/
      permission.module.ts
      permission.controller.ts
      permission.service.ts

  common/
    interceptors/
      tenant-scope.interceptor.ts    ← injects tenantId into query context
    filters/
      http-exception.filter.ts
```

**Key implementation detail — `PermissionsGuard`:**

```typescript
// Pseudocode
@RequirePermission('brand_orders', 'APPROVE')
@Patch(':id/approve')
async approveOrder(@Param('id') id: string) { ... }

// Guard checks:
// 1. If user.isAdmin → allow
// 2. Else → look up user's role permissions (cached in Redis)
// 3. Check if (module: 'brand_orders', action: 'APPROVE') exists in role's permission set
// 4. Allow or throw ForbiddenException
```

Role permissions should be **cached in Redis** on login (`role:{roleId}:permissions`) and invalidated whenever `PUT /roles/:id/permissions` is called — avoids a DB join on every single request.

---

## 5. Seed Data Requirements

Before other modules can be built, this module needs seed data for:

- Default system roles per tenant: `Admin`, `Business Head`, `Operations Head`, `Operations Manager`, `KAM` (marked `isSystemRole: true`)
- Full permission list across all modules (Brand Portal, Vendor Portal, Workflow Engine, Audit Logs, System Admin) — this list should be finalized once Modules 3–6 are scoped, since permissions are module-dependent

---

## 6. Open Items Before Coding Starts

- Confirm: can a User have **only one Role**, or should multi-role-per-user be supported? (Current schema assumes one role per user — simpler, matches PRD's role-based structure)
- Confirm: Admin — one global Admin, or one per tenant? (Current schema treats `isAdmin` as a per-user flag, works either way)
- OTP vs password login — affects whether `passwordHash` is required or optional

---

## Next Step

Once confirmed, proceed to **Module 2: Workflow Engine** (Approval rules, escalation, history) — this depends on Module 1's Role/Permission structure being finalized first.
