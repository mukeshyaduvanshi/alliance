# Module 3B (v2): Region-Based Rate Master + Brand Override Pricing

**Platform:** ColorJet Enterprise
**Supersedes:** Module 3B v1's `BrandProductRate` design
**Depends on:** Module 1 (Core), Module 3A (Brand)

---

## 1. Scope (Further Revised)

Pricing is now **two-layered**:

**Layer 1 — Region Master Rate (Admin sets at Product creation):**
Every Product gets a base rate for each of 6 regions — **PAN India, North India, South India, East India, West India, Kerala**. Two separate master rate sets: one for what Brands pay (selling price), one for what Vendors get paid (payout price).

**Layer 2 — Assignment (per Brand / per Vendor):**
A Brand is mapped to a region → gets that region's default rate automatically. Admin can **override** with a custom negotiated rate for that specific Brand if needed. Same pattern applies to Vendor (built in Module 4, but the Vendor-side master rate table is created now since it's Product-scoped).

---

## 2. Prisma Schema

```prisma
// ============================
// REGION ENUM
// ============================

enum Region {
  PAN_INDIA
  NORTH_INDIA
  SOUTH_INDIA
  EAST_INDIA
  WEST_INDIA
  KERALA
}

// ============================
// PRODUCT REGION RATE (Brand-side selling price master)
// ============================

model ProductRegionRate {
  id            String   @id @default(uuid())
  productId     String   @map("product_id")
  region        Region

  rate          Decimal  @db.Decimal(10, 2)

  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  product       Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([productId, region])
  @@map("product_region_rates")
}

// ============================
// VENDOR REGION RATE (Vendor-side payout price master)
// ============================

model VendorRegionRate {
  id            String   @id @default(uuid())
  productId     String   @map("product_id")
  region        Region

  rate          Decimal  @db.Decimal(10, 2)

  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  product       Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([productId, region])
  @@map("vendor_region_rates")
}

// ============================
// BRAND PRODUCT RATE (revised — region-based + override)
// ============================

model BrandProductRate {
  id             String    @id @default(uuid())
  tenantId       String    @map("tenant_id")
  brandId        String    @map("brand_id")
  productId      String    @map("product_id")

  region         Region                                    // which region this brand maps to
  isCustomRate   Boolean   @default(false) @map("is_custom_rate")
  customRate     Decimal?  @map("custom_rate") @db.Decimal(10, 2)   // set only if isCustomRate = true

  isActive       Boolean   @default(true) @map("is_active")
  assignedById   String    @map("assigned_by_id")

  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  tenant         Tenant   @relation(fields: [tenantId], references: [id])
  brand          Brand    @relation(fields: [brandId], references: [id])
  product        Product  @relation(fields: [productId], references: [id])
  assignedBy     User     @relation(fields: [assignedById], references: [id])

  @@unique([brandId, productId])
  @@index([tenantId, brandId])
  @@map("brand_product_rates")
}
```

**Note on `Product` model:** add these two relations to the existing `Product` model (from v1):
```prisma
  regionRates       ProductRegionRate[]
  vendorRegionRates VendorRegionRate[]
  brandRates        BrandProductRate[]   // already existed in v1
```

**Design notes:**
- **Effective rate resolution** (computed at read-time, not stored redundantly): if `isCustomRate = true`, use `customRate`; else look up `ProductRegionRate` for `(productId, region)`. This avoids data duplication — if Admin later changes the PAN India base rate, every Brand mapped to PAN India (without a custom override) automatically reflects the new rate.
- **`VendorRegionRate` is built now** (Product-scoped, set alongside `ProductRegionRate` when Admin creates a product) even though the `Vendor` model itself doesn't exist until Module 4. When Module 4 builds `VendorProductRate`, it will follow the exact same override pattern as `BrandProductRate`.
- **6 regions, Kerala separate from South India** — modeled as-is per your requirement, not nested/hierarchical (simpler, matches how the rate sheet is actually organized).

---

## 3. API Endpoints (Updated)

### 3.1 Admin — Product Creation with Region Rates
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/products` | Create product **with region rates array** (both brand-side and vendor-side, 6 entries each) |
| PATCH | `/api/v1/products/:id/region-rates` | Update brand-side region rates |
| PATCH | `/api/v1/products/:id/vendor-region-rates` | Update vendor-side region rates |
| GET | `/api/v1/products/:id` | Returns product **with both rate tables included** |

### 3.2 Admin — Brand Rate Assignment (Updated)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/brands/:brandId/rates` | Assign product to Brand — pick `region` (default rate applies) OR set `customRate` |
| PATCH | `/api/v1/brands/:brandId/rates/:productId` | Change region, or toggle custom override |

*(Vendor rate assignment endpoints will be added in Module 4, mirroring this exactly)*

---

## 4. Create Product — Updated DTO & Flow

```typescript
export class RegionRateInput {
  @IsEnum(Region)
  region: Region;

  @IsNumber()
  @Min(0)
  rate: number;
}

export class CreateProductDto {
  @IsString()
  name: string;

  // ... existing fields (sku, description, unit, categoryId, imageUrls, status)

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegionRateInput)
  brandRegionRates: RegionRateInput[];   // expect all 6 regions

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegionRateInput)
  vendorRegionRates: RegionRateInput[];  // expect all 6 regions
}
```

```typescript
async create(tenantId: string, dto: CreateProductDto) {
  const product = await this.prisma.product.create({
    data: {
      tenantId,
      name: dto.name,
      sku: dto.sku,
      description: dto.description,
      unit: dto.unit,
      categoryId: dto.categoryId,
      imageUrls: dto.imageUrls ?? [],
      status: dto.status,
    },
  });

  await this.prisma.productRegionRate.createMany({
    data: dto.brandRegionRates.map((r) => ({
      productId: product.id,
      region: r.region,
      rate: r.rate,
    })),
  });

  await this.prisma.vendorRegionRate.createMany({
    data: dto.vendorRegionRates.map((r) => ({
      productId: product.id,
      region: r.region,
      rate: r.rate,
    })),
  });

  return this.findOne(tenantId, product.id);
}
```

---

## 5. Rate Assignment & Resolution Logic (Updated)

```typescript
async assignRate(tenantId: string, brandId: string, dto: AssignBrandRateDto, assignedById: string) {
  return this.prisma.brandProductRate.upsert({
    where: { brandId_productId: { brandId, productId: dto.productId } },
    update: {
      region: dto.region,
      isCustomRate: dto.isCustomRate ?? false,
      customRate: dto.isCustomRate ? dto.customRate : null,
      isActive: true,
      assignedById,
    },
    create: {
      tenantId,
      brandId,
      productId: dto.productId,
      region: dto.region,
      isCustomRate: dto.isCustomRate ?? false,
      customRate: dto.isCustomRate ? dto.customRate : null,
      assignedById,
    },
  });
}
```

**Resolving the effective rate for a Brand's product listing:**
```typescript
async findProductsForBrand(brandId: string) {
  const rates = await this.prisma.brandProductRate.findMany({
    where: { brandId, isActive: true, product: { deletedAt: null, status: 'ACTIVE' } },
    include: {
      product: { include: { category: true, regionRates: true } },
    },
  });

  return rates.map((r) => {
    const effectiveRate = r.isCustomRate
      ? r.customRate
      : r.product.regionRates.find((rr) => rr.region === r.region)?.rate;

    return {
      ...r.product,
      region: r.region,
      isCustomRate: r.isCustomRate,
      rate: effectiveRate,
    };
  });
}
```

This is the core logic — Brand sees ONE final `rate` number, but under the hood it's either pulled live from the region master or a locked-in custom value.

---

## 6. Open Items

- **Brand's region** — should this be auto-derived from the Brand's `BusinessProfile.state` (Module 3A), or does Admin manually pick the region per Brand-Product assignment (current design — manual, more flexible since a Brand's ordering region might differ from their registered address)?
- **Vendor side** — confirmed to mirror this exactly; will be finalized in Module 4 when `Vendor` model exists, using `VendorRegionRate` (already built here) as the default source.

---

## Next Step

Migrate this revised schema (replaces v1's simpler `BrandProductRate`), then build the updated Product creation + rate assignment endpoints. After that: **Module 3C: Order Management + Artwork Approval**.
