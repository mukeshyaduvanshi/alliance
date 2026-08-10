# ColorJet Backend — End-to-End Testing Guide
## All 9 Modules, One Continuous Flow

**How to use:** Run these in order in your terminal. Each response gives you an ID — save it as a shell variable so the next command can use it. Replace `http://localhost:4000/api/v1` with your actual base URL if different.

---

## SETUP — Save your base URL

```bash
export API=http://localhost:4000/api/v1
```

---

## PHASE 1: Admin Login (Module 1)

```bash
ADMIN_TOKEN=$(curl -s -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@colorjet.com","password":"Admin@123"}' | jq -r '.accessToken')

echo "Admin Token: $ADMIN_TOKEN"
```

**Check:** Token should print, not `null`. If `null`, login failed — check credentials.

---

## PHASE 2: Create a Role + Assign Permissions (Module 1)

```bash
ROLE_ID=$(curl -s -X POST $API/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "Test KAM", "department": "Sales"}' | jq -r '.id')

echo "Role ID: $ROLE_ID"
```

**Check:** Get an ID back, then list permissions and assign a few to this role so you can test with a non-super-admin user later:
```bash
curl -s -X GET $API/permissions -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

---

## PHASE 3: Configure Workflow Rules (Module 2)

```bash
curl -s -X POST $API/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "Brand Onboarding Approval", "module": "brand_onboarding"}' | jq

curl -s -X POST $API/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "Vendor Onboarding Approval", "module": "vendor_onboarding"}' | jq
```

Save the returned `id` from each, then add a step to both (use your Admin's role or the Role ID from Phase 2):
```bash
BRAND_WORKFLOW_ID="<paste-brand-onboarding-workflow-id>"
VENDOR_WORKFLOW_ID="<paste-vendor-onboarding-workflow-id>"

curl -s -X POST $API/workflows/$BRAND_WORKFLOW_ID/steps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"stepOrder\": 1, \"approverRoleId\": \"$ROLE_ID\"}" | jq

curl -s -X POST $API/workflows/$VENDOR_WORKFLOW_ID/steps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"stepOrder\": 1, \"approverRoleId\": \"$ROLE_ID\"}" | jq
```

---

## PHASE 4: Brand Registration + Approval (Module 3A)

```bash
curl -s -X POST $API/brand-registration \
  -H "Content-Type: application/json" \
  -d '{
    "legalName": "Test Textiles Pvt Ltd",
    "businessType": "PRIVATE_LIMITED",
    "panNumber": "TESTB1234C",
    "gstNumber": "07TESTB1234C1Z5",
    "addressLine1": "1 Test Street",
    "city": "Delhi",
    "state": "Delhi",
    "pincode": "110001",
    "brandName": "Test Brand",
    "contactPersonName": "Test Contact",
    "email": "testbrand@example.com",
    "phone": "9999999991",
    "password": "Brand@123"
  }' | jq

BRAND_ID=$(curl -s -X GET $API/brands -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id')
echo "Brand ID: $BRAND_ID"

curl -s -X POST $API/brands/$BRAND_ID/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"remarks": "KYC verified"}' | jq
```

**Check:** `approvalStatus` should now be `APPROVED`.

**Brand logs in:**
```bash
BRAND_TOKEN=$(curl -s -X POST $API/brand-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testbrand@example.com","password":"Brand@123"}' | jq -r '.accessToken')

echo "Brand Token: $BRAND_TOKEN"
```

---

## PHASE 5: Vendor Registration + Approval (Module 4)

```bash
curl -s -X POST $API/vendor-registration \
  -H "Content-Type: application/json" \
  -d '{
    "legalName": "Test Printers Pvt Ltd",
    "businessType": "PRIVATE_LIMITED",
    "panNumber": "TESTV5678D",
    "addressLine1": "2 Test Industrial Area",
    "city": "Gurgaon",
    "state": "Haryana",
    "pincode": "122001",
    "vendorName": "Test Vendor",
    "contactPersonName": "Test Vendor Contact",
    "email": "testvendor@example.com",
    "phone": "9999999992",
    "password": "Vendor@123"
  }' | jq

VENDOR_ID=$(curl -s -X GET $API/vendors -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id')
echo "Vendor ID: $VENDOR_ID"

curl -s -X POST $API/vendors/$VENDOR_ID/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"remarks": "KYC verified"}' | jq

VENDOR_TOKEN=$(curl -s -X POST $API/vendor-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testvendor@example.com","password":"Vendor@123"}' | jq -r '.accessToken')

echo "Vendor Token: $VENDOR_TOKEN"
```

---

## PHASE 6: Product Catalog + Region Rates (Module 3B)

```bash
PRODUCT_ID=$(curl -s -X POST $API/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Test Flex Banner",
    "unit": "sq.ft",
    "brandRegionRates": [
      {"region": "PAN_INDIA", "rate": 45},
      {"region": "NORTH_INDIA", "rate": 50},
      {"region": "SOUTH_INDIA", "rate": 48},
      {"region": "EAST_INDIA", "rate": 47},
      {"region": "WEST_INDIA", "rate": 49},
      {"region": "KERALA", "rate": 52}
    ],
    "vendorRegionRates": [
      {"region": "PAN_INDIA", "rate": 30},
      {"region": "NORTH_INDIA", "rate": 32},
      {"region": "SOUTH_INDIA", "rate": 31},
      {"region": "EAST_INDIA", "rate": 30},
      {"region": "WEST_INDIA", "rate": 33},
      {"region": "KERALA", "rate": 34}
    ]
  }' | jq -r '.id')

echo "Product ID: $PRODUCT_ID"
```

**Assign a rate to the Brand (region default, North India):**
```bash
curl -s -X POST $API/brands/$BRAND_ID/rates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"productId\": \"$PRODUCT_ID\", \"region\": \"NORTH_INDIA\"}" | jq
```

**Vendor selects their rate:**
```bash
curl -s -X POST $API/vendor/products/select-rate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d "{\"productId\": \"$PRODUCT_ID\", \"region\": \"NORTH_INDIA\"}" | jq
```

**Brand checks their catalog (should show rate 50):**
```bash
curl -s -X GET $API/brand/products -H "Authorization: Bearer $BRAND_TOKEN" | jq
```

---

## PHASE 7: Business Model Config (Module 9)

```bash
curl -s -X POST $API/brands/$BRAND_ID/business-model \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"businessModel": "MEDIATOR_MODEL", "commissionPercent": 15}' | jq
```

---

## PHASE 8: Purchase Order (Module 3C)

```bash
PO_ID=$(curl -s -X POST $API/brands/$BRAND_ID/purchase-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"poNumber": "PO-TEST-001", "totalBudget": 10000}' | jq -r '.id')

echo "PO ID: $PO_ID"
```

---

## PHASE 9: Place Order — Ready Artwork Path (Module 3C)

```bash
ORDER_ID=$(curl -s -X POST $API/brand/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BRAND_TOKEN" \
  -d "{
    \"items\": [{\"productId\": \"$PRODUCT_ID\", \"quantity\": 10}],
    \"siteLocation\": \"Test Store, MG Road, Delhi\",
    \"artworkSubmissionType\": \"READY_ARTWORK\",
    \"artworkFileUrl\": \"https://example.com/test-art.pdf\",
    \"artworkFileName\": \"test-artwork.pdf\",
    \"poId\": \"$PO_ID\"
  }" | jq -r '.id')

echo "Order ID: $ORDER_ID"

curl -s -X GET $API/orders/$ORDER_ID -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.status'
```

**Check:** Status should be `PENDING_VENDOR_ASSIGNMENT` (Ready Artwork skips Creative Manager).

---

## PHASE 10: Assign Vendor + Negotiate (Module 4 + 3C)

```bash
curl -s -X POST $API/orders/$ORDER_ID/assign-vendor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"vendorId\": \"$VENDOR_ID\"}" | jq

curl -s -X GET $API/vendor/orders/$ORDER_ID -H "Authorization: Bearer $VENDOR_TOKEN" | jq
```

**Vendor negotiates:**
```bash
NEGOTIATION_ID=$(curl -s -X POST $API/vendor/orders/$ORDER_ID/negotiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{"proposedAmount": 350, "remarks": "Material cost increased"}' | jq -r '.id')

echo "Negotiation ID: $NEGOTIATION_ID"
```

**Manager views + responds:**
```bash
curl -s -X GET $API/orders/$ORDER_ID/negotiations -H "Authorization: Bearer $ADMIN_TOKEN" | jq

curl -s -X POST $API/orders/negotiations/$NEGOTIATION_ID/respond \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status": "ACCEPTED", "responseRemarks": "Approved"}' | jq
```

---

## PHASE 11: Order Fulfillment (Module 3C)

```bash
curl -s -X PATCH $API/orders/$ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status": "IN_PRODUCTION"}' | jq '.status'

curl -s -X PATCH $API/orders/$ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status": "INSTALLATION_COMPLETE"}' | jq '.status'

curl -s -X PATCH $API/orders/$ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status": "PAYMENT_PENDING"}' | jq '.status'

curl -s -X PATCH $API/orders/$ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status": "PAYMENT_RECEIVED"}' | jq '.status'
```

**Check:** Should end at `PAYMENT_RECEIVED`.

---

## PHASE 12: Monitoring & Analytics (Module 5)

```bash
curl -s -X PATCH $API/brands/$BRAND_ID/assign-kam \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"kamUserId": "<your-admin-or-kam-user-id>"}' | jq

curl -s -X GET $API/dashboard/performance -H "Authorization: Bearer $ADMIN_TOKEN" | jq

curl -s -X GET $API/dashboard/sla-status -H "Authorization: Bearer $ADMIN_TOKEN" | jq

curl -s -X GET $API/alerts -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

---

## PHASE 13: System Admin Panel (Module 6)

```bash
curl -s -X GET $API/system/health -H "Authorization: Bearer $ADMIN_TOKEN" | jq
curl -s -X GET $API/system/error-logs -H "Authorization: Bearer $ADMIN_TOKEN" | jq
curl -s -X GET $API/system/email-logs -H "Authorization: Bearer $ADMIN_TOKEN" | jq
curl -s -X GET $API/system/sms-logs -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Check `email-logs` — you should see entries from Brand approval and Vendor assignment notifications sent in earlier phases.**

---

## PHASE 14: Notifications (Module 8)

```bash
curl -s -X GET $API/brand/notifications -H "Authorization: Bearer $BRAND_TOKEN" | jq
curl -s -X GET $API/vendor/notifications -H "Authorization: Bearer $VENDOR_TOKEN" | jq
curl -s -X GET $API/brand/notifications/unread-count -H "Authorization: Bearer $BRAND_TOKEN" | jq
```

**Check:** Brand should have a notification from approval (Phase 4). Vendor should have one from order assignment (Phase 10).

---

## PHASE 15: Audit Trail — The Full Picture (Module 7)

This is the real payoff — every action across all 14 phases above should now be traceable:

```bash
curl -s -X GET "$API/audit-logs?page=1&pageSize=100" -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Check:** You should see logs for — Admin login, role creation, product creation, order placement, vendor assignment, status changes, negotiation response, business model config, and more — all with timestamps, actor names, and IP addresses.

**Filter to just this Brand's activity:**
```bash
curl -s -X GET "$API/audit-logs?actorType=BRAND&actorId=$BRAND_ID" -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Export it:**
```bash
curl -s -X GET $API/audit-logs/export -H "Authorization: Bearer $ADMIN_TOKEN" -o test-audit-export.csv
cat test-audit-export.csv
```

---

## SUCCESS CRITERIA — What "all 9 modules working together" looks like

By the end of this script, you should be able to confirm:

| # | Check | Module |
|---|---|---|
| 1 | Admin logged in, role + permissions work | 1 |
| 2 | Two workflow rules configured and used automatically | 2 |
| 3 | Brand self-registered, got approved, could log in | 3A |
| 4 | Product created with 6 region rates (both sides), Brand got their specific rate | 3B |
| 5 | Order placed against a PO, PO budget consumed correctly | 3C |
| 6 | Vendor self-registered, approved, selected own rate, got assigned the order | 4 |
| 7 | Vendor negotiated, Manager saw full history and accepted it | 3C + 4 |
| 8 | Order moved through every status to PAYMENT_RECEIVED | 3C |
| 9 | KAM dashboard, performance stats, SLA status all returned data | 5 |
| 10 | System health, error/email/SMS logs all populated | 6 |
| 11 | Notifications appeared for both Brand and Vendor at the right moments | 8 |
| 12 | Business model config set and validated correctly | 9 |
| 13 | Every single action above shows up in the audit trail | 7 |

If all 13 rows check out, your backend's core business flow is fully wired end-to-end — not just individually working modules, but actually talking to each other correctly.

---

## Troubleshooting Tip

If any `jq -r '.id'` or `.accessToken` prints `null`, the previous `curl` call likely failed. Re-run that specific command **without** the `-s` flag and without piping to `jq` to see the raw error response:

```bash
curl -X POST $API/whatever-endpoint -H "..." -d '...'
```

That will show you the actual error message instead of a silent `null`.
