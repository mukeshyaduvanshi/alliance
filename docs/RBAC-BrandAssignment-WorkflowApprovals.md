# Role-Based Access, Brand Assignment & Workflow Approvals

## Overview

Ye document batata hai ki platform mein **permission-based access**, **multiple managers per brand**, aur **brand-scoped workflow approvals** kaise kaam karte hain.

---

## 1. Permission-Based Sidebar (Manager App)

### Kaise kaam karta hai

Har role ke permissions `module:action` pairs hote hain (e.g. `order:VIEW`, `workflow:APPROVE`).
Login par ye permissions JWT mein aati hain aur `session.permissions` mein store hoti hain.

Manager app ka sidebar har menu item par `permission` check karta hai:

```ts
// apps/manager/lib/navigation.ts
{
  title: "Orders",
  href: "/orders",
  permission: { module: "order", action: "VIEW" },
}
```

Layout filter logic (`apps/manager/app/(dashboard)/layout.tsx`):

```ts
function isAllowed(item, session) {
  if (!session) return false;
  if (session.user?.isAdmin) return true;           // Admin = sab kuch
  if (item.permission) {
    return hasPermission(item.permission.module, item.permission.action, session);
  }
  if (item.anyOf?.length) {
    return item.anyOf.some((p) => hasPermission(p.module, p.action, session));
  }
  return true;
}
```

`hasPermission` (`packages/utils/src/auth.ts`):

```ts
if (s.user.isAdmin) return true;
return s.permissions?.some((p) => p.module === module && p.action === action) ?? false;
```

### Result

| Manager ke paas permission | Sidebar dikhega |
| --- | --- |
| `dashboard:VIEW` | Dashboard |
| `brand:VIEW` | My Brands |
| `order:VIEW` | Orders |
| `workflow:VIEW` | Approvals (Pending + History) |
| `vendor:VIEW` | Vendors |
| `sla_rule:VIEW` ya `alert:VIEW` | SLA & Alerts |
| `notification:VIEW` | Notifications |

Jab bhi admin role ki permissions update karta hai aur manager dobara login karta hai,
naya JWT generate hota hai → sidebar automatically update ho jata hai.

---

## 2. Multiple Managers per Brand

### Schema

Naya join table `BrandAssignment` (`packages/database/prisma/schema.prisma`):

```prisma
model BrandAssignment {
  id         String   @id @default(uuid())
  brandId    String
  userId     String
  assignedBy String?
  createdAt  DateTime @default(now())

  brand Brand @relation(fields: [brandId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([brandId, userId])
  @@index([userId])
  @@map("brand_assignments")
}
```

- Ek brand par **kayi managers** assign ho sakte hain (`@@unique([brandId, userId])` = ek user ek brand par sirf ek baar)
- Purana `assignedKamId` single-KAM field **backward-compatible** rakh diya gaya hai
- Brand ka `assignedKamId` assign hone par bhi `BrandAssignment` se match ho jata hai

### API

| Endpoint | Permission | Kaam |
| --- | --- | --- |
| `GET /brands/:brandId/managers` | `brand:VIEW` | Brand ke managers list karo |
| `POST /brands/:brandId/managers` | `brand:EDIT` | Managers assign karo (`{ userIds: [...] }`) |
| `DELETE /brands/:brandId/managers/:userId` | `brand:EDIT` | Manager remove karo |
| `GET /dashboard/kam` | `dashboard:VIEW` | Logged-in user ke assigned brands (dono se: `assignedKamId` + `BrandAssignment`) |

### Admin UI

`apps/admin/features/brands/brand-detail.tsx` → "Assigned Managers" card:
- Select se user pick karo → "Add Manager" button
- Assigned managers list dikhti hai (name, email, role) + X button se remove
- Duplicate assign nahi ho sakta (client + DB dono level par check)

---

## 3. Brand-Scoped Workflow Approvals

### Problem (jo pehle tha)

Pehle `GET /workflow-instances/pending` sirf **role** se filter karta tha:
agar 5 manager same role me hain to sabko saari pending dikhti thi.

### Ab kya hota hai

`workflow-instance.service.ts` ka `getPending` ab **2 filters** lagata hai:

```ts
const filtered = instances.filter((instance) => {
  const currentStep = instance.workflowRule.steps.find(
    (s) => s.stepOrder === instance.currentStepOrder,
  );
  const isRoleMatch = currentStep?.approverRoleId === userRoleId;  // 1. Role check
  if (!isRoleMatch) return false;
  if (assignedBrandIds.length === 0) return true;

  if (instance.entityType === 'Brand') {
    return assignedBrandIds.includes(instance.entityId);            // 2. Brand scope
  }
  return true;
});
```

Controller (`workflow-instance.controller.ts`) pending call karne se pehle
user ke assigned brand IDs nikalta hai:

```ts
const assignedBrandIds = await this.monitoringService.getAssignedBrandIds(
  req.user.tenantId,
  req.user.userId,
);
```

### Result

| Situation | Pending me kya dikhega |
| --- | --- |
| Manager ka brand assigned hai (BrandAssignment ya assignedKamId) | Us brand ke PENDING instances |
| Manager ka koi brand assigned nahi | Role-match wali saari pending (fallback) |
| Manager ka role approver nahi hai | Kuch nahi |
| Admin (`isAdmin`) | Sab kuch (permission bypass) |

> Note: Brand-scoping abhi sirf `entityType === 'Brand'` (brand onboarding) par apply hota hai.
> Orders jaise future modules ke liye entity→brand mapping add karni hogi.

---

## 4. Manager ke Assigned Brands (My Brands)

Manager app ka "My Brands" page (`apps/manager/features/brands/brand-list.tsx`)
aur dashboard dono `GET /dashboard/kam` use karte hain.

`getKamDashboard` ab brands is tarah filter karta hai:

```ts
where: {
  tenantId,
  deletedAt: null,
  OR: [
    { assignedKamId: kamUserId },           // legacy single KAM
    { id: { in: assignedBrandIds } },        // naya multi-manager
  ],
}
```

Isliye manager ko **sirf uske assigned brands** dikhte hain — koi bhi aur brand nahi.

---

## 5. Poore Flow ka Example

Maan lo: "Operation Manager" role ko `brand:VIEW`, `workflow:VIEW`, `workflow:APPROVE` permission di gayi.

1. **Admin** → Brand detail → Assigned Managers → Rahul (Operation Manager) ko brand "Nike" assign kiya
2. **Nike** signup karta hai → `brand_onboarding` rule trigger → PENDING instance
3. **Rahul** manager app login karta hai:
   - Sidebar: My Brands + Approvals dikhta hai (permission ke hisaab se)
   - My Brands: sirf "Nike" dikhta hai
   - Approvals → Pending: Nike ka instance dikhta hai (role match + brand assigned)
4. Rahul "Approve" karta hai → instance ka step advance
5. Saare steps approve hone par → Nike `APPROVED` + brand ko notification jaati hai

---

## 6. Kya-Kya Implement Karna Baaki Hai (Future)

- **Order-level brand scoping**: `entityType === 'Order'` ke instances ko bhi brand-scope karna
- **Manager brand-detail access control**: manager ko bina-assigned brand ka detail page na khulne dena
- **Permission cache invalidation**: login ke baad permission update hui to turant reflect ho
