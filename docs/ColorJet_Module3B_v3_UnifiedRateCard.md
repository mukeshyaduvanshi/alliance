# Module 3B (v3): Unified Rate Card — Admin / Brand / Vendor

**Platform:** ColorJet Enterprise
**Supersedes/extends:** Module 3B v2 (`ColorJet_Module3B_v2_RegionRates.md`)
**Depends on:** Module 1 (Core), Module 3A (Brand), Module 4 (Vendor)

---

## 1. Goal

Currently pricing is split across three silos and not editable from every portal:

- Admin sets master region rates (`ProductRegionRate`, `VendorRegionRate`) but the **admin UI never collects them** — the product form posts empty arrays.
- Brands **cannot** add/change their own rate from the brand portal (admin-only assignment).
- Vendors can only *pick a region* (which references the admin master) — they **cannot set their own custom rate**.

**v3 goal:** One unified rate card that **every party can edit end-to-end**, and every party sees the **same region-wise structure**:

| Region | Admin master (Brand px) | Brand own rate | Admin master (Vendor px) | Vendor own rate |
|---|---|---|---|---|
| PAN_INDIA | ✅ | ✅ (custom override) | ✅ | ✅ (custom override) |
| NORTH_INDIA | ✅ | ✅ | ✅ | ✅ |
| SOUTH_INDIA | ✅ | ✅ | ✅ | ✅ |
| EAST_INDIA | ✅ | ✅ | ✅ | ✅ |
| WEST_INDIA | ✅ | ✅ | ✅ | ✅ |
| KERALA | ✅ | ✅ | ✅ | ✅ |

---

## 2. Design

### 2.1 Master region rates (Admin sets, already in v2)

- `ProductRegionRate` — brand-side **selling price** master per product × region.
- `VendorRegionRate` — vendor-side **payout price** master per product × region.
- Missing today: **admin UI** to input these at product create/edit. (Backend already accepts them.)

### 2.2 Per-party override (extend for Vendor, already exists for Brand)

- `BrandProductRate` — per brand × product: `region`, `isCustomRate`, `customRate`. (Already exists.)
- `VendorProductRate` — currently stores only `region`. **Needs** `isCustomRate + customRate` to mirror Brand.

### 2.3 Effective-rate resolution (unchanged pattern)

For a party × product:
1. If `isCustomRate = true` → use `customRate` (party's own negotiated rate).
2. Else → look up the **master** `ProductRegionRate`/`VendorRegionRate` for `(product, region)`.

This keeps one source of truth; admin can push new master rates and every non-overridden party auto-reflects them.

---

## 3. Schema Changes

```prisma
// EXTEND existing VendorProductRate:
model VendorProductRate {
  id        String @id @default(uuid())
  tenantId  String
  vendorId  String
  productId String

  region       Region
  isCustomRate Boolean  @default(false)
  customRate   Decimal?          // <= NEW

  isActive Boolean @default(true)
  // ...relations + @@unique([vendorId, productId])
}
```

No new tables required. Product/region master tables are unchanged.

---

## 4. API Endpoints

### 4.1 Admin — catalog
| Method | Endpoint | What |
|---|---|---|
| POST | `/api/v1/products` | Create product **with 6 brand + 6 vendor region rates** |
| PATCH | `/api/v1/products/:id` | Update product fields + rates |
| PATCH | `/api/v1/products/:id/region-rates` | Update brand master region rates |
| PATCH | `/api/v1/products/:id/vendor-region-rates` | Update vendor master region rates |
| GET | `/api/v1/products/:id` | Returns product + both rate sets |

### 4.2 Brand portal — self-service rate
| Method | Endpoint | What |
|---|---|---|
| GET | `/api/v1/brand/products` | Brand rate card (effective rate already resolved) |
| PATCH | `/api/v1/brand/products/:id/rate` | Set own region **or** custom rate override (NEW) |

### 4.3 Vendor portal — self-service rate
| Method | Endpoint | What |
|---|---|---|
| GET | `/api/v1/vendor/products` | Browse products + vendor master rates |
| POST | `/api/v1/vendor/products/select-rate` | Set vendor region (keep existing) |
| PATCH | `/api/v1/vendor/products/:id/rate` | Set own **custom** rate override (NEW) |

### 4.4 Admin — per-entity override (existing, kept)
| Method | Endpoint | What |
|---|---|---|
| POST | `/api/v1/brands/:brandId/rates` | Assign brand rate (region or custom) |
| POST | `/api/v1/vendors/:vendorId/rates` | Assign vendor rate + master (region or custom) |

---

## 5. Frontend Work

### 5.1 Admin `/catalog/products`
- Product create/edit form gets a **Region Rates editor**:
  - Table with 6 rows (PAN_INDIA … KERALA) × 2 columns: **Brand rate** and **Vendor rate**.
- Product row/table optionally shows a compact rate summary.
- Reuse existing `useUpdateRegionRates` for edits.

### 5.2 Brand `/products` (rate card)
- Show effective rate + whether it's Standard/Custom (existing table).
- Add **"Set my rate"** action → options:
  - Use standard (region master) rate
  - Enter custom rate → `PATCH /brand/products/:id/rate`

### 5.3 Vendor `/rates`
- Keep "Add Rate" (product+region) for standard/master rates.
- Add **custom rate** input → `PATCH /vendor/products/:id/rate`.

### 5.4 Consistency
- All three portals render rates in the same **region rows** (PAN_INDIA, NORTH_INDIA, SOUTH_INDIA, EAST_INDIA, WEST_INDIA, KERALA) so the numbers match across the system for the same party.

---

## 6. Open Items
- Role/scoping: brand/vendor rate changes are limited to their own entity (no cross-entity writes).
- Order creation should keep using the resolved effective rate (unchanged from current snapshots).

---

## Next Step
Implement in order: (1) schema+migration, (2) backend endpoints, (3) frontend (admin → brand → vendor), (4) verify end-to-end.