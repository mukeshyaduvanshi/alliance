# Module 3A: Business Profile & Brand Registration
## Self-Registration + Workflow-Based Approval

**Platform:** ColorJet Enterprise
**Depends on:** Module 1 (Core), Module 2 (Workflow Engine)

---

## 1. Scope

This sub-module covers:
- `BusinessProfile` — reusable PAN/GST/MSME/address model (shared by Brand and Vendor, as decided earlier)
- `Brand` — the business entity itself
- Public self-registration flow (Brand signs up without needing an Admin to create the account)
- Approval via the **Workflow Engine (Module 2)** — no separate approval logic written here
- Brand's own login, once approved

**Explicitly NOT in this sub-module** (comes in 3B/3C/3D): Products, Orders, Artwork, Invoices.

---

## 2. Prisma Schema

```prisma
// ============================
// BUSINESS PROFILE — ENUMS
// ============================

enum BusinessType {
  PROPRIETORSHIP
  PARTNERSHIP
  PRIVATE_LIMITED
  LLP
  PUBLIC_LIMITED
  OTHER
}

enum BrandApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

// ============================
// BUSINESS PROFILE (shared: Brand & Vendor)
// ============================

model BusinessProfile {
  id              String        @id @default(uuid())

  legalName       String        @map("legal_name")
  businessType    BusinessType  @map("business_type")

  panNumber       String        @map("pan_number")
  gstNumber       String?       @map("gst_number")
  msmeNumber      String?       @map("msme_number")

  panDocUrl       String?       @map("pan_doc_url")
  gstDocUrl       String?       @map("gst_doc_url")
  msmeDocUrl      String?       @map("msme_doc_url")

  addressLine1    String        @map("address_line1")
  addressLine2    String?       @map("address_line2")
  city            String
  state           String
  pincode         String
  country         String        @default("India")

  isVerified      Boolean       @default(false) @map("is_verified")
  verifiedAt      DateTime?     @map("verified_at")

  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  brand           Brand?

  @@unique([panNumber])
  @@map("business_profiles")
}

// ============================
// BRAND
// ============================

model Brand {
  id                  String               @id @default(uuid())
  tenantId            String               @map("tenant_id")
  businessProfileId   String               @unique @map("business_profile_id")

  brandName           String               @map("brand_name")
  contactPersonName   String               @map("contact_person_name")
  email               String
  phone               String
  passwordHash        String?              @map("password_hash")

  logoUrl             String?              @map("logo_url")
  approvalStatus       BrandApprovalStatus @default(PENDING) @map("approval_status")
  workflowInstanceId   String?             @map("workflow_instance_id")   // links to Module 2

  isActive            Boolean              @default(true) @map("is_active")

  createdAt           DateTime             @default(now()) @map("created_at")
  updatedAt           DateTime             @updatedAt @map("updated_at")
  deletedAt            DateTime?           @map("deleted_at")

  tenant              Tenant               @relation(fields: [tenantId], references: [id])
  businessProfile     BusinessProfile      @relation(fields: [businessProfileId], references: [id])

  @@unique([tenantId, email])
  @@index([tenantId, approvalStatus])
  @@map("brands")
}
```

**Design notes:**
- `Brand.workflowInstanceId` — stores which `WorkflowInstance` (Module 2) is tracking this brand's approval. Not a hard FK (kept loose) since a Brand could theoretically be re-submitted with a new instance after rejection.
- `Brand.approvalStatus` is **denormalized** from the workflow instance status — this is intentional. Querying "show me all pending brands" would otherwise require a join into the Workflow Engine every time; keeping a synced copy here makes brand-listing queries fast. It gets updated via an event/callback when the workflow instance changes (see Section 5).
- `passwordHash` is nullable — a Brand can't log in until approved, so it may not be set at registration time (depends on Step 4 decision below).
- Soft delete on `Brand`, not on `BusinessProfile` — deleting a Brand shouldn't destroy statutory KYC records (compliance/audit reasons).

---

## 3. API Endpoints

### 3.1 Public (No Auth) — Self-Registration
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/brand-registration` | Brand submits registration (business + KYC details) |
| GET | `/api/v1/brand-registration/status?email=` | Check own application status (no login needed yet) |

### 3.2 Admin — Approval Management
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/brands` | List all brands (filter by `approvalStatus`) |
| GET | `/api/v1/brands/:id` | Get brand details + business profile |
| POST | `/api/v1/brands/:id/approve` | Approve brand (delegates to Workflow Engine) |
| POST | `/api/v1/brands/:id/reject` | Reject brand (delegates to Workflow Engine) |
| PATCH | `/api/v1/brands/:id/status` | Activate/Deactivate an already-approved brand |

### 3.3 Brand Portal (Brand's own login, post-approval)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/brand-auth/login` | Brand login (separate from internal-team auth) |
| GET | `/api/v1/brand-auth/me` | Get own profile |
| PATCH | `/api/v1/brand-auth/me` | Update own profile (not business/KYC fields — those need re-approval) |

---

## 4. NestJS Module Structure

```
apps/backend/src/modules/
  brand/
    brand.module.ts
    brand.controller.ts            ← Admin-facing (list, approve, reject)
    brand-registration.controller.ts ← Public-facing (self-registration)
    brand-auth.controller.ts       ← Brand's own login
    brand.service.ts
    dto/
      register-brand.dto.ts
      approve-brand.dto.ts
      reject-brand.dto.ts
```

---

## 5. Core Service Logic

**Registration — creates `BusinessProfile` + `Brand`, then kicks off Module 2's Workflow Engine:**

```typescript
async register(tenantId: string, dto: RegisterBrandDto) {
  const existingPan = await this.prisma.businessProfile.findUnique({
    where: { panNumber: dto.panNumber },
  });
  if (existingPan) {
    throw new ConflictException('A business is already registered with this PAN');
  }

  const businessProfile = await this.prisma.businessProfile.create({
    data: {
      legalName: dto.legalName,
      businessType: dto.businessType,
      panNumber: dto.panNumber,
      gstNumber: dto.gstNumber,
      msmeNumber: dto.msmeNumber,
      panDocUrl: dto.panDocUrl,
      gstDocUrl: dto.gstDocUrl,
      msmeDocUrl: dto.msmeDocUrl,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      state: dto.state,
      pincode: dto.pincode,
    },
  });

  const passwordHash = await bcrypt.hash(dto.password, 10);

  const brand = await this.prisma.brand.create({
    data: {
      tenantId,
      businessProfileId: businessProfile.id,
      brandName: dto.brandName,
      contactPersonName: dto.contactPersonName,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      approvalStatus: 'PENDING',
    },
  });

  // Kick off Workflow Engine — reuses Module 2, no new approval logic here
  const instance = await this.workflowInstanceService.start(
    tenantId,
    { module: 'brand_onboarding', entityType: 'Brand', entityId: brand.id },
    null, // system-initiated, no internal user
  );

  await this.prisma.brand.update({
    where: { id: brand.id },
    data: { workflowInstanceId: instance.id },
  });

  return { message: 'Registration submitted, pending approval', brandId: brand.id };
}
```

**Approve — delegates to Workflow Engine, then syncs `approvalStatus`:**

```typescript
async approve(tenantId: string, brandId: string, userId: string, roleId: string, remarks?: string) {
  const brand = await this.getBrandOrThrow(tenantId, brandId);

  await this.workflowInstanceService.approve(
    tenantId, brand.workflowInstanceId, userId, roleId, remarks,
  );

  // Re-check: did this approval complete the whole chain, or just move to next step?
  const instance = await this.workflowInstanceService.findOne(tenantId, brand.workflowInstanceId);

  return this.prisma.brand.update({
    where: { id: brandId },
    data: { approvalStatus: instance.status === 'APPROVED' ? 'APPROVED' : 'PENDING' },
  });
}
```

**Reject — same delegation pattern:**
```typescript
async reject(tenantId: string, brandId: string, userId: string, roleId: string, remarks?: string) {
  const brand = await this.getBrandOrThrow(tenantId, brandId);

  await this.workflowInstanceService.reject(
    tenantId, brand.workflowInstanceId, userId, roleId, remarks,
  );

  return this.prisma.brand.update({
    where: { id: brandId },
    data: { approvalStatus: 'REJECTED' },
  });
}
```

This is the payoff of Module 2's generic design — **zero new approval logic** was written here, just calls into the existing engine.

---

## 6. Brand Login — separate JWT context

Brand login is **not** the same as internal-team login (Module 1's `AuthService`). Reasons:
- Different table (`Brand` vs `User`)
- Must check `approvalStatus === 'APPROVED'` before allowing login
- JWT payload shape differs (`brandId` instead of `userId` + `roleId`)

```typescript
async brandLogin(email: string, password: string) {
  const brand = await this.prisma.brand.findFirst({
    where: { email, deletedAt: null },
  });

  if (!brand || !brand.passwordHash) {
    throw new UnauthorizedException('Invalid credentials');
  }

  if (brand.approvalStatus !== 'APPROVED') {
    throw new ForbiddenException('Your account is pending approval');
  }

  const isValid = await bcrypt.compare(password, brand.passwordHash);
  if (!isValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const payload = { sub: brand.id, brandId: brand.id, type: 'brand' };
  const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

  return { accessToken, brand: { id: brand.id, brandName: brand.brandName, email: brand.email } };
}
```

A separate `BrandJwtStrategy` + `BrandAuthGuard` will be needed (parallel to Module 1's, but validating against the `Brand` table) — this keeps internal-team and brand authentication completely isolated, which matches the PRD's "independent sessions per portal" requirement.

---

## 7. Workflow Rule Setup Required (before this works end-to-end)

Before registration can complete, Admin must configure a `WorkflowRule` for `module: 'brand_onboarding'` (via Module 2's endpoints) — e.g.:
```
Name: Brand Onboarding Approval
Module: brand_onboarding
Steps: Step 1 → KAM role (initial KYC check)
       Step 2 → Business Head role (final approval)
```
This is a one-time Admin setup step, not code.

---

## 8. Open Items Before Coding Starts

- Confirm: does `Brand.password` get set **at registration** (current design), or only **after approval** via an invite link? (Setting it at registration is simpler but means a rejected applicant already has stored credentials they can't use — acceptable, but worth confirming)
- Document upload flow — this needs Cloudflare R2 presigned URLs (pattern already proven in Hotel SaaS); to be wired in when building the actual registration form
- GST number — should it be mandatory, or optional for very small brands (matches MSME optionality in PRD)?

---

## Next Step

Once implemented and tested, proceed to **Module 3B: Product Management** — Brand's product catalog, tied to the now-existing `Brand` model.
