# Module 3B: Product Management

**Platform:** ColorJet Enterprise
**Depends on:** Module 1 (Core), Module 3A (Brand)

---

## 1. Scope

Brand's product catalog — the items a Brand can eventually place orders for (printing/production jobs). Keeps things simple: no variants/SKUs complexity yet, since that's not called out in the PRD. Can extend later if needed.

**Covers:**
- `ProductCategory` — simple grouping (Brand-defined or Admin-defined, TBD in Open Items)
- `Product` — the catalog item itself, owned by a Brand
- Brand-side CRUD (their own products only)
- Admin-side read visibility across all Brands (for oversight/reporting)

**Not in scope here:** Orders (3C), pricing negotiations, inventory/stock tracking (not mentioned in PRD — flag if needed later).

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
// PRODUCT CATEGORY
// ============================

model ProductCategory {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  brandId       String    @map("brand_id")

  name          String
  description   String?

  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  brand         Brand     @relation(fields: [brandId], references: [id])
  products      Product[]

  @@unique([brandId, name])
  @@map("product_categories")
}

// ============================
// PRODUCT
// ============================

model Product {
  id              String         @id @default(uuid())
  tenantId        String         @map("tenant_id")
  brandId         String         @map("brand_id")
  categoryId      String?        @map("category_id")

  name            String
  sku             String?
  description     String?

  unitPrice       Decimal        @map("unit_price") @db.Decimal(10, 2)
  unit            String         @default("piece")     // piece, box, roll, etc.

  imageUrls       String[]       @map("image_urls")     // Cloudflare R2 links

  status          ProductStatus  @default(DRAFT)

  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")
  deletedAt       DateTime?      @map("deleted_at")

  tenant          Tenant           @relation(fields: [tenantId], references: [id])
  brand           Brand            @relation(fields: [brandId], references: [id])
  category        ProductCategory? @relation(fields: [categoryId], references: [id])

  @@unique([brandId, sku])
  @@index([tenantId, brandId, status])
  @@map("products")
}
```

**Design notes:**
- `unitPrice` uses `Decimal` (not `Float`) — money fields should never use floating point, matches standard practice for financial data.
- `imageUrls` is a `String[]` array — Postgres native array support via Prisma, avoids a separate join table for something this simple.
- `sku` is optional and unique **per brand** (not globally) — two different Brands can use the same SKU convention without conflict.
- Soft delete throughout, consistent with the rest of the schema.

---

## 3. API Endpoints

### 3.1 Brand-side (Brand's own login required)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/brand/products` | Create product |
| GET | `/api/v1/brand/products` | List own products |
| GET | `/api/v1/brand/products/:id` | Get product details |
| PATCH | `/api/v1/brand/products/:id` | Update product |
| DELETE | `/api/v1/brand/products/:id` | Soft-delete product |
| PATCH | `/api/v1/brand/products/:id/status` | Activate/Deactivate/Draft |
| POST | `/api/v1/brand/product-categories` | Create category |
| GET | `/api/v1/brand/product-categories` | List own categories |

### 3.2 Admin-side (Internal team, read-only oversight)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/products` | List all products (filter by `brandId`, `status`) |
| GET | `/api/v1/products/:id` | Get product details |

---

## 4. NestJS Module Structure

```
apps/backend/src/modules/
  product/
    product.module.ts
    product.controller.ts          ← Brand-facing, uses BrandJwtAuthGuard
    product-admin.controller.ts    ← Admin-facing, uses JwtAuthGuard + PermissionsGuard
    product.service.ts
    dto/
      create-product.dto.ts
      update-product.dto.ts
      create-category.dto.ts
```

---

## 5. Key Service Logic

```typescript
@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  // Brand-scoped — every method takes brandId, never trusts client-supplied brandId
  async create(tenantId: string, brandId: string, dto: CreateProductDto) {
    if (dto.sku) {
      const existing = await this.prisma.product.findFirst({
        where: { brandId, sku: dto.sku, deletedAt: null },
      });
      if (existing) throw new ConflictException('SKU already in use for this brand');
    }
    return this.prisma.product.create({ data: { tenantId, brandId, ...dto } });
  }

  async findAllForBrand(brandId: string) {
    return this.prisma.product.findMany({
      where: { brandId, deletedAt: null },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForBrand(brandId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, brandId, deletedAt: null },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  // Admin — sees across all brands, tenant-scoped only
  async findAllForAdmin(tenantId: string, brandId?: string, status?: string) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(brandId ? { brandId } : {}),
        ...(status ? { status: status as any } : {}),
      },
      include: { brand: true, category: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

**Critical pattern:** every Brand-facing method takes `brandId` from the **JWT payload** (`req.user.brandId`), never from the request body — this prevents one Brand from editing another Brand's products by guessing IDs.

---

## 6. Controller Pattern (Brand-side, using `BrandJwtAuthGuard` from Module 3A)

```typescript
@UseGuards(BrandJwtAuthGuard)
@Controller('brand/products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateProductDto) {
    return this.productService.create(req.user.tenantId, req.user.brandId, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.productService.findAllForBrand(req.user.brandId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.productService.findOneForBrand(req.user.brandId, id);
  }

  // ... update, delete, status follow same pattern
}
```

---

## 7. Open Items Before Coding Starts

- Should `ProductCategory` be **Brand-defined** (each brand makes their own categories, as currently modeled) or a **global/Admin-defined taxonomy** shared across all brands (better for cross-brand reporting)? Current schema assumes Brand-defined — flag if a shared taxonomy is preferred.
- Does a Product need approval before going live (like Brand registration did), or can a Brand publish immediately? Current design: immediate, no workflow. If approval is needed, this would plug into Module 2 exactly like Brand registration did.
- Inventory/stock quantity — not in PRD, confirm if truly out of scope or was just not mentioned.

---

## Next Step

Once implemented, proceed to **Module 3C: Order Management + Artwork Approval** — this is where Products actually get used, and where the Workflow Engine gets its second real use case (artwork approval).
