# Module 3B (v4): Rate Catalog — Admin Master Rate + Brand/Vendor Own Rates

**Platform:** ColorJet Enterprise
**Supersedes UX of:** `ColorJet_Module3B_v3_UnifiedRateCard.md`
**Depends on:** Module 1 (Core), Module 3A (Brand), Module 4 (Vendor)

---

## 1. Goal (Revamped)

The admin `/catalog/products` page currently deals with **Products + Categories**. The user wants to replace this with a **Rates** catalog:

1. **Admin** creates rate items (a label + measurement unit + value + **admin master rate**).
2. **Admin's master rate/price is NOT shown** to brands or vendors.
3. **Brands** and **Vendors** see only the rate **label + measurement unit/value** and set **their own rate** for each item. Admin does **not** set brand/vendor rates.
4. In the admin rate list (where "Category" used to be), show **what each brand quoted** and **what each vendor quoted**, **color-coded** against the admin master rate:
   - Brand/Vendor rate **> admin rate** → **red**
   - Brand/Vendor rate **< admin rate** → **green**
   - Equal / not set → neutral.
5. Admin picks the **unit** for each rate (e.g. per inch) along with a **measurement unit and its value**.

---

## 2. Data Model (new, replaces Product/Category usage in UI)

```prisma
enum RateUnit {
  INCH
  CM
  MM
  METER
  FOOT
  SQ_FT
  SQ_M
  OTHER
}

model Rate {
  id              String    @id @default(uuid())
  tenantId        String
  label           String    // e.g. "Premium Vinyl Print" — shown to brand/vendor
  unit            RateUnit  // pricing/measurement unit (INCH, SQ_FT, ...)
  measurementValue Decimal? // measurement magnitude (e.g. 0.5, 12)
  adminRate       Decimal   // ADMIN MASTER RATE — hidden from brand/vendor
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  tenant       Tenant        @relation(...)
  brandRates   BrandRate[]
  vendorRates  VendorRate[]

  @@unique([tenantId, label])
  @@map("rates")
}

model BrandRate {
  id       String @id @default(uuid())
  tenantId String
  brandId  String
  rateId   String

  price    Decimal            // brand's own rate for this item
  isActive Boolean @default(true)

  brand Brand @relation(...)
  rate  Rate  @relation(...)

  @@unique([brandId, rateId])
  @@map("brand_rates")
}

model VendorRate {
  id       String @id @default(uuid())
  tenantId String
  vendorId String
  rateId   String

  price    Decimal            // vendor's own rate for this item
  isActive Boolean @default(true)

  vendor Vendor @relation(...)
  rate   Rate   @relation(...)

  @@unique([vendorId, rateId])
  @@map("vendor_rates")
}
```

**Note:** Old `Product`, `ProductCategory`, regional rate tables stay in the DB (used by orders) but the **Rate Catalog** is the new UI the portals use.

---

## 3. API Endpoints

### 3.1 Admin — Rate CRUD
| Method | Endpoint | What |
|---|---|---|
| GET | `/api/v1/rates` | List rate items **with brand/vendor quoted prices** for color-coded overview |
| POST | `/api/v1/rates` | Create rate (label, unit, measurementValue, adminRate) |
| PATCH | `/api/v1/rates/:id` | Update rate |
| DELETE | `/api/v1/rates/:id` | Soft-delete rate |

### 3.2 Brand portal — own rates
| Method | Endpoint | What |
|---|---|---|
| GET | `/api/v1/brand/rates` | List rates: **label + unit + measurementValue only** (NO admin rate) |
| PATCH | `/api/v1/brand/rates/:rateId` | Set own rate price |

### 3.3 Vendor portal — own rates
| Method | Endpoint | What |
|---|---|---|
| GET | `/api/v1/vendor/rates` | List rates: **label + unit + measurementValue only** (NO admin rate) |
| PATCH | `/api/v1/vendor/rates/:rateId` | Set own rate price |

---

## 4. Frontend Work

### 4.1 Admin `/catalog/products` (renamed → Rate Catalog)
- Create/edit dialog: **label**, **unit select** (INCH, SQ_FT, ...), **measurement unit + value**, **admin master rate**.
- List table columns:
  - Rate (label + unit + measurement value)
  - Admin master rate
  - Brand quoted rate → **green if < admin, red if > admin**
  - Vendor quoted rate → **green if < admin, red if > admin**
- No Category column.

### 4.2 Brand `/products`
- Table shows: rate **label**, **unit**, **measurement value**, and brand's own rate input (standard/custom removed — brand just sets one own price).
- Admin rate never displayed.

### 4.3 Vendor `/rates`
- Table shows: rate **label**, **unit**, **measurement value**, and vendor's own rate input.
- Admin rate never displayed.

---

## 5. Open Items (to be confirmed with user)
1. Replace the entire Product/Category UI with Rates, or keep old product pages accessible?
2. Do rates still need **regions** (PAN_INDIA, NORTH_INDIA, ...), or is one rate per item enough?
3. "Measurement unit + value": interpret as a unit selector + a numeric measurement value field — confirm.

---

## Next Step
Confirm the 3 open items, then implement: schema → backend → admin UI → brand UI → vendor UI → verify.