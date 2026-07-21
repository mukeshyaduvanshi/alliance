# Module 3B: Product Catalog & Brand-Specific Pricing (Revised)

**Platform:** ColorJet Enterprise
**Depends on:** Module 1 (Core), Module 3A (Brand)

---

## 1. Scope (Revised Understanding)

**Key correction from earlier draft:** Products are **not** Brand-created. ColorJet (Admin/Business Head/KAM) maintains a **master product catalog** (Flex Board, Flex Banner, etc.). Pricing is then **negotiated per-Brand** — the same product can have different rates for different Brands.

**Covers:**
- `Product` — master catalog, Admin-owned, tenant-scoped (not Brand-scoped)
- `ProductCategory` — Admin-defined grouping (shared taxonomy, not per-brand)
- `BrandProductRate` — the join table where Admin assigns a specific rate to a specific Brand for a specific Product
- Brand-side: can only **view** products they have an assigned rate for (hidden until a rate exists — per your confirmed default)
- Admin-side: full CRUD on catalog + rate assignment per Brand

---

## 2. Prisma Schema

```prisma
// ============================
// PRODUCT — ENUMS
// ============================

enum ProductStatus {
  ACTIVE
  INACTIVE
  DRAFT
}

// ============================
// PRODUCT CATEGORY (Admin-defined, shared across all Brands)
// ============================

model ProductCategory {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")

  name          String
  description   String?

  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  products      Product[]

  @@unique([tenantId, name])
  @@map("product_categories")
}

// ============================
// PRODUCT (Master Catalog — ColorJet-owned)
// ============================

model Product {
  id              String         @id @default(uuid())
  tenantId        String         @map("tenant_id")
  categoryId      String?        @map("category_id")

  name            String                                    // e.g. "Flex Banner", "Flex Board"
  sku             String?
  description     String?
  unit            String         @default("sq.ft")           // sq.ft, piece, roll, etc.

  imageUrls       String[]       @map("image_urls")

  status          ProductStatus  @default(ACTIVE)

  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")
  deletedAt       DateTime?      @map("deleted_at")

  tenant          Tenant             @relation(fields: [tenantId], references: [id])
  category        ProductCategory?   @relation(fields: [categoryId], references: [id])
  brandRates      BrandProductRate[]

  @@unique([tenantId, sku])
  @@index([tenantId, status])
  @@map("products")
}

// ============================
// BRAND PRODUCT RATE (per-Brand negotiated pricing)
// ============================

model BrandProductRate {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  brandId       String    @map("brand_id")
  productId     String    @map("product_id")

  rate          Decimal   @db.Decimal(10, 2)                 // negotiated price for THIS brand
  isActive      Boolean   @default(true) @map("is_active")

  assignedById  String    @map("assigned_by_id")             // which internal User set this rate

  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  brand         Brand    @relation(fields: [brandId], references: [id])
  product       Product  @relation(fields: [productId], references: [id])
  assignedBy    User     @relation(fields: [assignedById], references: [id])

  @@unique([brandId, productId])   // one active rate per brand-product pair
  @@index([tenantId, brandId])
  @@map("brand_product_rates")
}
```

**Design notes:**
- `Product` has **no `brandId`** anymore — it's tenant-scoped only, matching "ColorJet defines it" requirement.
- `BrandProductRate` is the pricing bridge — `@@unique([brandId, productId])` ensures one rate per Brand-Product combo (updating just overwrites the rate, doesn't create duplicates).
- `isActive` on the rate (not just deleting it) — lets Admin temporarily disable a Brand's access to a product without losing the negotiated rate history.
- `assignedById` tracks **which internal team member** set the rate — useful for accountability/audit later.
- Brand's product listing query will **inner-join through `BrandProductRate`** — so a product with no rate assigned for that Brand simply won't appear (matches your confirmed default).

---

## 3. API Endpoints

### 3.1 Admin — Master Catalog Management
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/products` | Create master product |
| GET | `/api/v1/products` | List all products (catalog) |
| GET | `/api/v1/products/:id` | Get product details |
| PATCH | `/api/v1/products/:id` | Update product |
| DELETE | `/api/v1/products/:id` | Soft-delete product |
| POST | `/api/v1/product-categories` | Create category |
| GET | `/api/v1/product-categories` | List categories |

### 3.2 Admin — Brand-Specific Rate Assignment
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/brands/:brandId/rates` | Assign/update a rate for a Brand + Product |
| GET | `/api/v1/brands/:brandId/rates` | List all rates assigned to a Brand |
| DELETE | `/api/v1/brands/:brandId/rates/:productId` | Remove a Brand's access to a product |
| PATCH | `/api/v1/brands/:brandId/rates/:productId/status` | Enable/Disable a rate |

### 3.3 Brand-side (their own login)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/brand/products` | List products **with rates assigned to this Brand only** |
| GET | `/api/v1/brand/products/:id` | Get one product + its rate for this Brand |

---

## 4. NestJS Module Structure

```
apps/backend/src/modules/
  product/
    product.module.ts
    product.controller.ts            ← Admin: catalog CRUD
    product-category.controller.ts   ← Admin: category CRUD
    brand-rate.controller.ts         ← Admin: assign rates per brand
    brand-product.controller.ts      ← Brand-facing: view own priced products
    product.service.ts
    brand-rate.service.ts
    dto/
      create-product.dto.ts
      update-product.dto.ts
      create-category.dto.ts
      assign-rate.dto.ts
```

---

## 5. Key Service Logic

**Admin assigns a rate:**
```typescript
@Injectable()
export class BrandRateService {
  constructor(private prisma: PrismaService) {}

  async assignRate(tenantId: string, brandId: string, dto: AssignRateDto, assignedById: string) {
    return this.prisma.brandProductRate.upsert({
      where: { brandId_productId: { brandId, productId: dto.productId } },
      update: { rate: dto.rate, isActive: true, assignedById },
      create: {
        tenantId,
        brandId,
        productId: dto.productId,
        rate: dto.rate,
        assignedById,
      },
    });
  }

  async listForBrand(tenantId: string, brandId: string) {
    return this.prisma.brandProductRate.findMany({
      where: { tenantId, brandId },
      include: { product: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

**Brand views their own priced catalog** (only products they have a rate for):
```typescript
async findProductsForBrand(brandId: string) {
  const rates = await this.prisma.brandProductRate.findMany({
    where: { brandId, isActive: true, product: { deletedAt: null, status: 'ACTIVE' } },
    include: { product: { include: { category: true } } },
  });

  // Shape response so the Brand sees product + their specific rate together
  return rates.map((r) => ({
    ...r.product,
    rate: r.rate,
  }));
}
```

This directly implements your requirement — a product only shows up for a Brand once Admin has assigned a rate; two Brands can see the same product with two different `rate` values.

---

## 6. Open Item

One thing worth confirming before coding: should `BrandProductRate` history be preserved when a rate **changes** (e.g. keep old rate as a log for "rate change history" / negotiation trail), or is overwrite-in-place (current design, via `upsert`) fine? If history matters, we'd add a lightweight `RateChangeLog` — small addition, doesn't affect the rest of the design.

---

## Next Step

Once this is implemented, **Module 3C: Order Management** will reference `BrandProductRate` directly — when a Brand places an order, the rate locked in at order time comes from here (with a snapshot copy on the order line item, so future rate changes don't retroactively affect past orders).
