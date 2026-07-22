# Module 3C (v2 — Revised): Order Management, Purchase Orders & Artwork Flow

**Platform:** ColorJet Enterprise
**Supersedes:** Module 3C v1 (payment timing and artwork flow were incorrect)
**Depends on:** Module 1 (Core), Module 3A (Brand), Module 3B (Product & Rates)

---

## 1. Scope (Corrected Understanding)

**Key corrections from v1:**
- Payment happens **after** installation is complete, not before production
- Orders can optionally be placed against a **Purchase Order (PO)** with a budget — PO created by Admin/KAM for a Brand
- Orders require **Vendor assignment** by Admin's internal team (manual selection)
- Artwork has **two distinct paths**:
  - **Reference** → Creative Manager designs the actual artwork → Brand approves/rejects
  - **Ready Artwork** → Brand's own final file → skips Creative Manager and Brand-approval entirely → straight to Vendor assignment

**Design note:** The Creative→Brand artwork approval loop does **not** use Module 2's Workflow Engine, because Module 2's approver is always an internal `Role` — a Brand is not an internal Role. This loop is handled with explicit `Order` status transitions instead.

---

## 2. Order Lifecycle

### Path A — Reference submitted (needs Creative team)
```
PLACED
  ↓
CREATIVE_IN_PROGRESS          ← Creative Manager is designing
  ↓
PENDING_BRAND_APPROVAL        ← Creative Manager submitted artwork
  ↓                    ↘
ARTWORK_APPROVED    ARTWORK_REJECTED → back to CREATIVE_IN_PROGRESS (new version)
  ↓
PENDING_VENDOR_ASSIGNMENT
  ↓
VENDOR_ASSIGNED
  ↓
IN_PRODUCTION
  ↓
INSTALLATION_COMPLETE
  ↓
PAYMENT_PENDING
  ↓
PAYMENT_RECEIVED
```

### Path B — Ready Artwork submitted (skips Creative + Brand-approval)
```
PLACED
  ↓
PENDING_VENDOR_ASSIGNMENT      ← straight here, no creative loop
  ↓
VENDOR_ASSIGNED → IN_PRODUCTION → INSTALLATION_COMPLETE → PAYMENT_PENDING → PAYMENT_RECEIVED
```

`CANCELLED` can happen from any pre-`IN_PRODUCTION` state.

---

## 3. Prisma Schema

```prisma
// ============================
// ORDER — ENUMS
// ============================

enum ArtworkSubmissionType {
  REFERENCE
  READY_ARTWORK
}

enum ArtworkFileType {
  REFERENCE
  CREATIVE_ARTWORK
  READY_ARTWORK
}

enum OrderStatus {
  PLACED
  CREATIVE_IN_PROGRESS
  PENDING_BRAND_APPROVAL
  ARTWORK_REJECTED
  ARTWORK_APPROVED
  PENDING_VENDOR_ASSIGNMENT
  VENDOR_ASSIGNED
  IN_PRODUCTION
  INSTALLATION_COMPLETE
  PAYMENT_PENDING
  PAYMENT_RECEIVED
  CANCELLED
}

// ============================
// PURCHASE ORDER (PO)
// ============================

model PurchaseOrder {
  id              String   @id @default(uuid())
  tenantId        String   @map("tenant_id")
  brandId         String   @map("brand_id")

  poNumber        String   @map("po_number")
  totalBudget     Decimal  @map("total_budget") @db.Decimal(12, 2)
  consumedAmount  Decimal  @default(0) @map("consumed_amount") @db.Decimal(12, 2)

  isActive        Boolean  @default(true) @map("is_active")
  createdById     String   @map("created_by_id")

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  tenant          Tenant  @relation(fields: [tenantId], references: [id])
  brand           Brand   @relation(fields: [brandId], references: [id])
  createdBy       User    @relation(fields: [createdById], references: [id])
  orders          Order[]

  @@unique([tenantId, poNumber])
  @@map("purchase_orders")
}

// ============================
// VENDOR (minimal stub — fully built out in Module 4)
// ============================

model Vendor {
  id            String   @id @default(uuid())
  tenantId      String   @map("tenant_id")

  vendorName    String   @map("vendor_name")
  isActive      Boolean  @default(true) @map("is_active")

  createdAt     DateTime @default(now()) @map("created_at")

  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  orders        Order[]

  @@map("vendors")
}

// ============================
// ORDER
// ============================

model Order {
  id                     String                 @id @default(uuid())
  tenantId               String                 @map("tenant_id")
  brandId                String                 @map("brand_id")
  poId                   String?                @map("po_id")
  vendorId               String?                @map("vendor_id")

  orderNumber            String                 @unique @map("order_number")
  status                 OrderStatus            @default(PLACED)
  artworkSubmissionType  ArtworkSubmissionType  @map("artwork_submission_type")

  siteLocation           String                 @map("site_location")
  totalAmount            Decimal                @map("total_amount") @db.Decimal(12, 2)

  createdAt              DateTime               @default(now()) @map("created_at")
  updatedAt              DateTime               @updatedAt @map("updated_at")
  deletedAt              DateTime?              @map("deleted_at")

  tenant                 Tenant          @relation(fields: [tenantId], references: [id])
  brand                  Brand           @relation(fields: [brandId], references: [id])
  po                     PurchaseOrder?  @relation(fields: [poId], references: [id])
  vendor                 Vendor?         @relation(fields: [vendorId], references: [id])
  items                  OrderItem[]
  artworks               OrderArtwork[]

  @@index([tenantId, status])
  @@index([brandId])
  @@map("orders")
}

// ============================
// ORDER ITEM
// ============================

model OrderItem {
  id            String   @id @default(uuid())
  orderId       String   @map("order_id")
  productId     String   @map("product_id")

  region        Region
  quantity      Decimal  @db.Decimal(10, 2)
  rateSnapshot  Decimal  @map("rate_snapshot") @db.Decimal(10, 2)
  amount        Decimal  @db.Decimal(12, 2)

  createdAt     DateTime @default(now()) @map("created_at")

  order         Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product       Product  @relation(fields: [productId], references: [id])

  @@map("order_items")
}

// ============================
// ORDER ARTWORK
// ============================

model OrderArtwork {
  id                String           @id @default(uuid())
  orderId           String           @map("order_id")

  type              ArtworkFileType
  fileUrl           String           @map("file_url")
  fileName          String           @map("file_name")
  version           Int              @default(1)

  uploadedByUserId  String?          @map("uploaded_by_user_id")
  uploadedAt        DateTime         @default(now()) @map("uploaded_at")

  order             Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)
  uploadedBy        User?  @relation(fields: [uploadedByUserId], references: [id])

  @@map("order_artworks")
}
```

**Design notes:**
- **`Vendor` is deliberately minimal here** — just enough to have a real foreign key for `Order.vendorId` instead of a loose/polymorphic reference. Module 4 will extend it with `BusinessProfile`, login, KYC approval — exactly like Brand was built in 3A.
- **`PurchaseOrder.consumedAmount`** — incremented when an order is placed against it, decremented if that order is cancelled. Budget check happens **before** order creation.
- **`OrderArtwork.version`** — increments each time Creative Manager resubmits after a Brand rejection, preserving full design history.
- **`OrderArtwork.uploadedByUserId` is nullable** — null when the Brand uploaded it, set when Creative Manager uploaded the designed artwork.

---

## 4. API Endpoints

### 4.1 Admin — Purchase Order Management
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/brands/:brandId/purchase-orders` | Create a PO for a Brand |
| GET | `/api/v1/brands/:brandId/purchase-orders` | List a Brand's POs |
| PATCH | `/api/v1/purchase-orders/:id/status` | Activate/Deactivate a PO |

### 4.2 Brand-side — Orders
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/brand/orders` | Place order (items + site location + artwork + optional `poId`) |
| GET | `/api/v1/brand/orders` | List own orders |
| GET | `/api/v1/brand/orders/:id` | Order details + artwork history |
| POST | `/api/v1/brand/orders/:id/approve-artwork` | Approve Creative Manager's artwork |
| POST | `/api/v1/brand/orders/:id/reject-artwork` | Reject — back to Creative Manager |
| POST | `/api/v1/brand/orders/:id/cancel` | Cancel own order (pre-production only) |

### 4.3 Admin/Internal — Order Processing
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/orders` | List all orders (filter by `status`, `brandId`, `vendorId`) |
| GET | `/api/v1/orders/:id` | Order details |
| POST | `/api/v1/orders/:id/creative-artwork` | Creative Manager submits designed artwork |
| POST | `/api/v1/orders/:id/assign-vendor` | Assign a Vendor to the order |
| PATCH | `/api/v1/orders/:id/status` | Advance status (production → installation complete → payment received) |

---

## 5. Core Service Logic

**Place order — validates PO budget, resolves rates, branches by artwork type:**

```typescript
async placeOrder(tenantId: string, brandId: string, dto: CreateOrderDto) {
  const itemsWithRates = await this.resolveOrderItems(brandId, dto.items);
  const totalAmount = itemsWithRates.reduce((sum, i) => sum + i.amount, 0);

  if (dto.poId) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: dto.poId, brandId, isActive: true },
    });
    if (!po) throw new NotFoundException('Purchase Order not found or inactive');

    const remaining = Number(po.totalBudget) - Number(po.consumedAmount);
    if (totalAmount > remaining) {
      throw new BadRequestException(`Insufficient PO budget. Remaining: ${remaining}`);
    }
  }

  const orderNumber = await this.generateOrderNumber(tenantId);
  const initialStatus =
    dto.artworkSubmissionType === 'REFERENCE' ? 'CREATIVE_IN_PROGRESS' : 'PENDING_VENDOR_ASSIGNMENT';

  return this.prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        tenantId,
        brandId,
        poId: dto.poId,
        orderNumber,
        totalAmount,
        siteLocation: dto.siteLocation,
        artworkSubmissionType: dto.artworkSubmissionType,
        status: initialStatus,
        items: { createMany: { data: itemsWithRates } },
        artworks: {
          create: {
            type: dto.artworkSubmissionType,
            fileUrl: dto.artworkFileUrl,
            fileName: dto.artworkFileName,
          },
        },
      },
    });

    if (dto.poId) {
      await tx.purchaseOrder.update({
        where: { id: dto.poId },
        data: { consumedAmount: { increment: totalAmount } },
      });
    }

    return created;
  });
}
```

**Creative Manager submits designed artwork:**
```typescript
async submitCreativeArtwork(tenantId: string, orderId: string, userId: string, dto: SubmitArtworkDto) {
  const order = await this.getOrderOrThrow(tenantId, orderId);
  if (order.status !== 'CREATIVE_IN_PROGRESS') {
    throw new BadRequestException('Order is not awaiting creative work');
  }

  const lastVersion = await this.prisma.orderArtwork.findFirst({
    where: { orderId, type: 'CREATIVE_ARTWORK' },
    orderBy: { version: 'desc' },
  });

  await this.prisma.orderArtwork.create({
    data: {
      orderId,
      type: 'CREATIVE_ARTWORK',
      fileUrl: dto.fileUrl,
      fileName: dto.fileName,
      version: (lastVersion?.version ?? 0) + 1,
      uploadedByUserId: userId,
    },
  });

  return this.prisma.order.update({
    where: { id: orderId },
    data: { status: 'PENDING_BRAND_APPROVAL' },
  });
}
```

**Brand approves/rejects — explicit status transition:**
```typescript
async approveArtwork(tenantId: string, orderId: string, brandId: string) {
  const order = await this.getOrderForBrand(tenantId, orderId, brandId);
  if (order.status !== 'PENDING_BRAND_APPROVAL') {
    throw new BadRequestException('No artwork pending your approval');
  }
  return this.prisma.order.update({
    where: { id: orderId },
    data: { status: 'PENDING_VENDOR_ASSIGNMENT' },
  });
}

async rejectArtwork(tenantId: string, orderId: string, brandId: string) {
  const order = await this.getOrderForBrand(tenantId, orderId, brandId);
  if (order.status !== 'PENDING_BRAND_APPROVAL') {
    throw new BadRequestException('No artwork pending your approval');
  }
  return this.prisma.order.update({
    where: { id: orderId },
    data: { status: 'CREATIVE_IN_PROGRESS' },
  });
}
```

**Admin assigns Vendor:**
```typescript
async assignVendor(tenantId: string, orderId: string, vendorId: string) {
  const order = await this.getOrderOrThrow(tenantId, orderId);
  if (order.status !== 'PENDING_VENDOR_ASSIGNMENT') {
    throw new BadRequestException('Order is not ready for vendor assignment');
  }
  return this.prisma.order.update({
    where: { id: orderId },
    data: { vendorId, status: 'VENDOR_ASSIGNED' },
  });
}
```

**Manual status progression (payment after completion):**
```typescript
async updateStatus(tenantId: string, orderId: string, status: OrderStatus) {
  const order = await this.getOrderOrThrow(tenantId, orderId);

  const validTransitions: Record<string, string[]> = {
    VENDOR_ASSIGNED: ['IN_PRODUCTION', 'CANCELLED'],
    IN_PRODUCTION: ['INSTALLATION_COMPLETE'],
    INSTALLATION_COMPLETE: ['PAYMENT_PENDING'],
    PAYMENT_PENDING: ['PAYMENT_RECEIVED'],
  };

  if (!validTransitions[order.status]?.includes(status)) {
    throw new BadRequestException(`Cannot move from ${order.status} to ${status}`);
  }

  return this.prisma.order.update({ where: { id: orderId }, data: { status } });
}
```

**Cancel order — releases PO budget:**
```typescript
async cancelOrder(tenantId: string, orderId: string, brandId: string) {
  const order = await this.getOrderForBrand(tenantId, orderId, brandId);
  const cancellableStates = ['PLACED', 'CREATIVE_IN_PROGRESS', 'PENDING_BRAND_APPROVAL', 'PENDING_VENDOR_ASSIGNMENT', 'VENDOR_ASSIGNED'];

  if (!cancellableStates.includes(order.status)) {
    throw new BadRequestException('Order can no longer be cancelled');
  }

  return this.prisma.$transaction(async (tx) => {
    if (order.poId) {
      await tx.purchaseOrder.update({
        where: { id: order.poId },
        data: { consumedAmount: { decrement: order.totalAmount } },
      });
    }
    return tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
  });
}
```

---

## 6. Permission Note

New permission modules needed in seed data: `order`, `purchase_order`, `creative_artwork`, `vendor_assignment` — so Admin can fine-tune exactly who (KAM vs Creative Manager vs Ops Manager) can do what.

---

## 7. Open Items

- **Who exactly is the "other Manager"** who receives approved/ready artwork and assigns the Vendor — KAM, Operations Manager, or a dedicated role? (Doesn't block schema — affects permission assignment in seed data / Admin UI later)
- **PO expiry** — should a PO have a time limit (e.g. valid 6 months), or budget-only as currently modeled?
- **Partial PO usage across multiple orders** — current design supports this naturally (`consumedAmount` accumulates) — confirm this matches intent.

---

## Next Step

Once implemented, this completes the core Brand Portal order flow. Next per the TRD roadmap: **Module 4: Vendor Portal** — the `Vendor` stub gets fully built out (BusinessProfile, self-registration + approval mirroring Module 3A, plus `VendorProductRate` using the `VendorRegionRate` master already built in Module 3B).
