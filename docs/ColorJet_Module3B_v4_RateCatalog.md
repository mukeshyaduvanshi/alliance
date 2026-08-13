# Module 3B (v4): Rate Catalog — Admin Master Rate + Brand/Vendor Own Rates

**Platform:** ColorJet Enterprise
**Supersedes UX of:** `ColorJet_Module3B_v3_UnifiedRateCard.md`
**Depends on:** Module 1 (Core), Module 3A (Brand), Module 4 (Vendor)

---

## 1. Goal (Confirmed)

Replace the admin `/catalog/products` page with a **Rate Catalog**:

1. **Admin** creates a rate item: `label` + **calculation unit** + calculation **width × height** + **measurement unit** + measurement **width × height** (**both units + w×h sizes kept together**).
2. Each rate carries an **admin master rate per region** (PAN_INDIA, NORTH_INDIA, SOUTH_INDIA, EAST_INDIA, WEST_INDIA, KERALA).
3. **Brands and Vendors** see only the rate **label + units + values**, and set their **own rate per region**.
4. **Admin's master rate is NOT shown** to brands/vendors.
5. Admin's rate list shows (in place of "Category"):
   - what **brands** quoted and what **vendors** quoted per region
   - **green** if a party's rate < admin master, **red** if > admin master.

---

## 2. Data Model (new)

```prisma
enum RateUnit {
  INCH
  CM
  MM
  METER
  FOOT
  SQ_FT
  SQ_M
  KILOGRAM
  OTHER
}

model Rate {
  id        String @id @default(uuid())
  tenantId  String

  label     String          // shown to brand/vendor

  calcUnit  RateUnit         // calculation unit (how they calculate)
  calcWidth Decimal?         // width of calculation size
  calcHeight Decimal?        // height of calculation size

  measUnit  RateUnit         // measurement unit (how they measure)
  measWidth Decimal?         // width of measurement size
  measHeight Decimal?        // height of measurement size

  isActive  Boolean @default(true)
  createdAt DateTime
  updatedAt DateTime
  deletedAt DateTime?

  tenant      Tenant            @relation(...)
  regions     RateRegionRate[]  // admin master per region
  brandRates  BrandRate[]
  vendorRates VendorRate[]

  @@unique([tenantId, label])
  @@map("rates")
}

model RateRegionRate {   // ADMIN master rate per region
  id     String @id
  rateId String
  region Region
  rate   Decimal

  @@unique([rateId, region])
  @@map("rate_region_rates")
}

model BrandRate {        // BRAND's own rate per region
  id       String @id
  tenantId String
  brandId  String
  rateId   String
  region   Region
  rate     Decimal

  @@unique([brandId, rateId, region])
  @@map("brand_rates")
}

model VendorRate {       // VENDOR's own rate per region
  id       String @id
  tenantId String
  vendorId String
  rateId   String
  region   Region
  rate     Decimal

  @@unique([vendorId, rateId, region])
  @@map("vendor_rates")
}
```

Old `Product`/`Category` tables remain in DB (used by orders) but are **not** surfaced on these pages.

---

## 3. API Endpoints

### 3.1 Admin — `/api/v1/rates`
| Method | What |
|---|---|
| GET | List rate catalog + admin region rates + brand/vendor quotes (aggregated per rate/region) |
| POST | Create rate (label, calcUnit+calcValue, measUnit+measValue, regionRates[]) |
| PATCH `/:id` | Update rate fields + region rates |
| DELETE `/:id` | Soft-delete |

### 3.2 Brand — `/api/v1/brand/rates`
| Method | What |
|---|---|
| GET | List rates: label + units/values only (NO admin rate) |
| PATCH `/:rateId/region/:region` | Set brand's own rate for a region |

### 3.3 Vendor — `/api/v1/vendor/rates`
| Method | What |
|---|---|
| GET | List rates: label + units/values only (NO admin rate) |
| PATCH `/:rateId/region/:region` | Set vendor's own rate for a region |

---

## 4. Frontend

### 4.1 Admin `/catalog/products` → Rate Catalog
- Create/edit dialog: label, calc unit select + calc value, meas unit select + meas value, and **6 region admin rates**.
- List columns: Rate (label + units/values) · Region group showing Admin / Brands / Vendors with **green `< admin`**, **red `> admin`**.

### 4.2 Brand `/products`
- List: label + calc/meas units + own rate per region (set own value). Admin rate hidden.

### 4.3 Vendor `/rates`
- List: label + calc/meas units + own rate per region (set own value). Admin rate hidden.

---

## Next Step
Implement: schema + migration → backend RateModule → admin UI → brand UI → vendor UI → verify.