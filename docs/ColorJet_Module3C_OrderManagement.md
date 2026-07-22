# Module 3C: Order Management & Artwork Approval

**Platform:** ColorJet Enterprise
**Depends on:** Module 1 (Core), Module 2 (Workflow Engine), Module 3A (Brand), Module 3B (Product & Rates)

---

## 1. Scope

This is where everything built so far comes together:

- Brand places an order using their **priced products** (Module 3B — rate resolved at order time and **locked/snapshotted**)
- Artwork is uploaded **at the same time** as order placement
- Artwork approval flows through the **Workflow Engine (Module 2)** — same reusable pattern as Brand registration
- Detailed order lifecycle status tracking

---

## 2. Order Lifecycle (Detailed Statuses)

```
PLACED
   ↓
ARTWORK_PENDING_APPROVAL   ← Workflow Engine instance running
   ↓                    ↘
ARTWORK_APPROVED      ARTWORK_REJECTED → (Brand can resubmit → back to PENDING_APPROVAL)
   ↓
PAYMENT_PENDING
   ↓
PAYMENT_RECEIVED
   ↓
IN_PRODUCTION
   ↓
DISPATCHED
   ↓
DELIVERED

(CANCELLED can happen from most pre-production states)
```

---

## 3. Prisma Schema

```prisma
// ============================
// ORDER — ENUMS
// ============================

enum OrderStatus {
  PLACED
  ARTWORK_PENDING_APPROVAL
  ARTWORK_APPROVED
  ARTWORK_REJECTED
  PAYMENT_PENDING
  PAYMENT_RECEIVED
  IN_PRODUCTION
  DISPATCHED
  DELIVERED
  CANCELLED
}

// ============================
// ORDER
// ============================

model Order {
  id                  String       @id @default(uuid())
  tenantId            String       @map("tenant_id")
  brandId             String       @map("brand_id")

  orderNumber         String       @unique @map("order_number")   // e.g. "CJ-2026-00001"
  status              OrderStatus  @default(PLACED)

  totalAmount         Decimal      @map("total_amount") @db.Decimal(12, 2)

  workflowInstanceId  String?      @map("workflow_instance_id")   // tracks artwork approval

  deliveryAddress     String       @map("delivery_address")
  expectedDeliveryDate DateTime?   @map("expected_delivery_date")

  createdAt           DateTime     @default(now()) @map("created_at")
  updatedAt           DateTime     @updatedAt @map("updated_at")
  deletedAt           DateTime?    @map("deleted_at")

  tenant              Tenant        @relation(fields: [tenantId], references: [id])
  brand                Brand        @relation(fields: [brandId], references: [id])
  items                OrderItem[]
  artworks             OrderArtwork[]

  @@index([tenantId, status])
  @@index([brandId])
  @@map("orders")
}

// ============================
// ORDER ITEM (rate snapshot at order time)
// ============================

model OrderItem {
  id            String   @id @default(uuid())
  orderId       String   @map("order_id")
  productId     String   @map("product_id")

  region        Region                                  // region used to resolve the rate at order time
  quantity      Decimal  @db.Decimal(10, 2)              // sq.ft, pieces, etc.
  rateSnapshot  Decimal  @map("rate_snapshot") @db.Decimal(10, 2)   // locked-in rate — never changes even if master rate changes later
  amount        Decimal  @db.Decimal(12, 2)              // quantity * rateSnapshot

  createdAt     DateTime @default(now()) @map("created_at")

  order         Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product       Product  @relation(fields: [productId], references: [id])

  @@map("order_items")
}

// ============================
// ORDER ARTWORK
// ============================

model OrderArtwork {
  id            String    @id @default(uuid())
  orderId       String    @map("order_id")

  fileUrl       String    @map("file_url")               // Cloudflare R2 link
  fileName      String    @map("file_name")

  uploadedAt    DateTime  @default(now()) @map("uploaded_at")

  order         Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("order_artworks")
}
```

**Design notes:**

- **`rateSnapshot` is the critical field** — this is exactly why Module 3B's rate resolution logic exists separately from storage. At order time, the app resolves the Brand's effective rate (region default or custom override) and **copies** it into `OrderItem.rateSnapshot`. If Admin changes the region rate next week, this order's amount is untouched — matches standard billing/invoicing practice.
- **`Order.workflowInstanceId`** — same pattern as `Brand.workflowInstanceId` in Module 3A. No new approval logic; artwork approval reuses Module 2 entirely, just with `module: 'artwork_approval'`.
- **Multiple artwork files per order** (`OrderArtwork[]`) — a single order might need several design files.
- **`orderNumber`** — human-readable, sequential-looking ID (`CJ-2026-00001`) separate from the UUID `id`, since UUIDs are bad for customer-facing references (invoices, calls with support, etc.)

---

## 4. API Endpoints

### 4.1 Brand-side (their own login)

| Method | Endpoint                                    | Description                                  |
| ------ | ------------------------------------------- | -------------------------------------------- |
| POST   | `/api/v1/brand/orders`                      | Place new order (items + artwork together)   |
| GET    | `/api/v1/brand/orders`                      | List own orders (filter by status)           |
| GET    | `/api/v1/brand/orders/:id`                  | Get order details + artwork + status history |
| POST   | `/api/v1/brand/orders/:id/resubmit-artwork` | Re-upload artwork after rejection            |
| POST   | `/api/v1/brand/orders/:id/cancel`           | Cancel own order (only if pre-production)    |

### 4.2 Admin-side

| Method | Endpoint                             | Description                                                                         |
| ------ | ------------------------------------ | ----------------------------------------------------------------------------------- |
| GET    | `/api/v1/orders`                     | List all orders (filter by `status`, `brandId`)                                     |
| GET    | `/api/v1/orders/:id`                 | Get order details                                                                   |
| POST   | `/api/v1/orders/:id/approve-artwork` | Approve (delegates to Workflow Engine)                                              |
| POST   | `/api/v1/orders/:id/reject-artwork`  | Reject (delegates to Workflow Engine)                                               |
| PATCH  | `/api/v1/orders/:id/status`          | Manually advance status (payment received → in production → dispatched → delivered) |

---

## 5. NestJS Module Structure

```
apps/backend/src/modules/
  order/
    order.module.ts
    order.controller.ts          ← Admin-facing
    brand-order.controller.ts    ← Brand-facing
    order.service.ts
    dto/
      create-order.dto.ts
      update-order-status.dto.ts
```

---

## 6. Core Service Logic

**Place order — resolves rate, snapshots it, creates items, kicks off artwork approval:**

```typescript
async placeOrder(tenantId: string, brandId: string, dto: CreateOrderDto) {
  // 1. Resolve rate for each item using Module 3B's brand rate logic
  const itemsWithRates = await Promise.all(
    dto.items.map(async (item) => {
      const brandRate = await this.prisma.brandProductRate.findFirst({
        where: { brandId, productId: item.productId, isActive: true },
        include: { product: { include: { regionRates: true } } },
      });
      if (!brandRate) throw new BadRequestException(`Product ${item.productId} not available for your account`);

      const rate = brandRate.isCustomRate
        ? brandRate.customRate
        : brandRate.product.regionRates.find((rr) => rr.region === brandRate.region)?.rate;

      if (!rate) throw new BadRequestException(`No rate configured for this product/region`);

      return {
        productId: item.productId,
        region: brandRate.region,
        quantity: item.quantity,
        rateSnapshot: rate,
        amount: Number(rate) * item.quantity,
      };
    }),
  );

  const totalAmount = itemsWithRates.reduce((sum, i) => sum + i.amount, 0);
  const orderNumber = await this.generateOrderNumber(tenantId);

  // 2. Create order + items + artwork in a transaction
  const order = await this.prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        tenantId,
        brandId,
        orderNumber,
        totalAmount,
        deliveryAddress: dto.deliveryAddress,
        expectedDeliveryDate: dto.expectedDeliveryDate,
        status: 'ARTWORK_PENDING_APPROVAL',
        items: { createMany: { data: itemsWithRates } },
        artworks: { createMany: { data: dto.artworks.map((a) => ({ fileUrl: a.fileUrl, fileName: a.fileName })) } },
      },
    });
    return created;
  });

  // 3. Kick off artwork approval workflow (Module 2 — zero new approval logic)
  const instance = await this.workflowInstanceService.start(
    tenantId,
    { module: 'artwork_approval', entityType: 'Order', entityId: order.id },
    undefined,
  );

  return this.prisma.order.update({
    where: { id: order.id },
    data: { workflowInstanceId: instance.id },
  });
}

private async generateOrderNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await this.prisma.order.count({ where: { tenantId } });
  return `CJ-${year}-${String(count + 1).padStart(5, '0')}`;
}
```

**Approve artwork — same delegation pattern as Brand approval:**

```typescript
async approveArtwork(tenantId: string, orderId: string, userId: string, roleId: string, remarks?: string) {
  const order = await this.getOrderOrThrow(tenantId, orderId);
  if (!order.workflowInstanceId) throw new BadRequestException('No approval workflow linked');

  await this.workflowInstanceService.approve(tenantId, order.workflowInstanceId, userId, roleId, remarks);
  const instance = await this.workflowInstanceService.findOne(tenantId, order.workflowInstanceId);

  return this.prisma.order.update({
    where: { id: orderId },
    data: {
      status: instance.status === 'APPROVED' ? 'ARTWORK_APPROVED' : 'ARTWORK_PENDING_APPROVAL',
    },
  });
}

async rejectArtwork(tenantId: string, orderId: string, userId: string, roleId: string, remarks?: string) {
  const order = await this.getOrderOrThrow(tenantId, orderId);
  if (!order.workflowInstanceId) throw new BadRequestException('No approval workflow linked');

  await this.workflowInstanceService.reject(tenantId, order.workflowInstanceId, userId, roleId, remarks);

  return this.prisma.order.update({
    where: { id: orderId },
    data: { status: 'ARTWORK_REJECTED' },
  });
}
```

**Manual status advance (post-approval stages — payment, production, dispatch):**

```typescript
async updateStatus(tenantId: string, orderId: string, status: OrderStatus) {
  const order = await this.getOrderOrThrow(tenantId, orderId);

  const validTransitions: Record<string, string[]> = {
    ARTWORK_APPROVED: ['PAYMENT_PENDING', 'CANCELLED'],
    PAYMENT_PENDING: ['PAYMENT_RECEIVED', 'CANCELLED'],
    PAYMENT_RECEIVED: ['IN_PRODUCTION'],
    IN_PRODUCTION: ['DISPATCHED'],
    DISPATCHED: ['DELIVERED'],
  };

  if (!validTransitions[order.status]?.includes(status)) {
    throw new BadRequestException(`Cannot move from ${order.status} to ${status}`);
  }

  return this.prisma.order.update({ where: { id: orderId }, data: { status } });
}
```

**Note the guard against invalid transitions** — prevents accidentally marking something "DELIVERED" before payment, for example.

---

## 7. Workflow Rule Setup Required

Before order placement fully works end-to-end, Admin must configure a `WorkflowRule` for `module: 'artwork_approval'` — same one-time setup pattern as Brand onboarding (Module 3A, Section 7).

---

## 8. Open Items

- **Artwork resubmission** — after rejection, should this create a **new** `WorkflowInstance` (clean history) or reuse the same one (`RESUBMITTED` decision type already exists in Module 2's `ApprovalDecision` enum for this)? Recommend reusing — the enum was designed for exactly this.
- **Payment integration** — `PAYMENT_RECEIVED` is currently a **manual Admin action**. If/when a payment gateway is wired in (Cashfree, per your existing pattern), this could become automatic via webhook. Flag for later, not blocking now.
- **Cancellation refund logic** — out of scope here; assume Admin handles refunds manually outside the platform for now.

---

## Next Step

Once implemented, **Module 3 (Brand Portal) is functionally complete** for the core B2B flow: Register → Approve → Browse Priced Catalog → Place Order → Artwork Approval → Fulfillment tracking.

After this, per the TRD roadmap: **Module 4: Vendor Portal** — this is where `VendorRegionRate` (already built in 3B) finally gets used via a `VendorProductRate` table mirroring `BrandProductRate`.
