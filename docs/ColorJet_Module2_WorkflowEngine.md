# Module 2: Workflow Engine
## Configurable Approvals, Escalation & History

**Platform:** ColorJet Enterprise
**Depends on:** Module 1 (Tenant, User, Role)

---

## 1. Scope

This module is the **reusable approval backbone** used by every other module — Brand order approvals, Vendor KYC approvals, discount approvals, etc. It does not know about "Orders" or "Vendors" directly; it works against a generic `entityType` + `entityId` reference, so any future module can plug into it without schema changes.

**Covers:**
- Admin-configurable workflow rules (single/multi-level)
- Step-based approval chains tied to Roles (not specific users — so it survives staff changes)
- Approval / Rejection / Escalation actions with remarks
- Full approval history
- Pending-approval dashboard query
- Escalation on timeout (via background job)

---

## 2. Prisma Schema

```prisma
// ============================
// ENUMS
// ============================

enum WorkflowInstanceStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

enum ApprovalDecision {
  APPROVED
  REJECTED
  ESCALATED
  RESUBMITTED
}

// ============================
// WORKFLOW RULE (Admin-configured)
// ============================

model WorkflowRule {
  id                String    @id @default(uuid())
  tenantId          String    @map("tenant_id")

  name              String                          // e.g. "Brand Order Approval"
  module            String                          // e.g. "brand_order", "vendor_kyc" — matches Permission.module convention
  description       String?

  isActive          Boolean   @default(true) @map("is_active")
  autoApprove       Boolean   @default(false) @map("auto_approve")   // if true, instance auto-approves with no steps
  escalationHours   Int?      @map("escalation_hours")               // null = no auto-escalation

  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  deletedAt         DateTime? @map("deleted_at")

  tenant            Tenant             @relation(fields: [tenantId], references: [id])
  steps             WorkflowStep[]
  instances         WorkflowInstance[]

  @@unique([tenantId, module])
  @@map("workflow_rules")
}

// ============================
// WORKFLOW STEP (ordered approval levels)
// ============================

model WorkflowStep {
  id                 String   @id @default(uuid())
  workflowRuleId     String   @map("workflow_rule_id")

  stepOrder          Int      @map("step_order")           // 1, 2, 3...
  approverRoleId     String   @map("approver_role_id")      // who must act at this level
  escalationRoleId   String?  @map("escalation_role_id")    // who it escalates to if overdue
  isOptional         Boolean  @default(false) @map("is_optional")

  createdAt          DateTime @default(now()) @map("created_at")

  workflowRule       WorkflowRule @relation(fields: [workflowRuleId], references: [id], onDelete: Cascade)
  approverRole       Role         @relation("StepApproverRole", fields: [approverRoleId], references: [id])
  escalationRole     Role?        @relation("StepEscalationRole", fields: [escalationRoleId], references: [id])
  actions            ApprovalAction[]

  @@unique([workflowRuleId, stepOrder])
  @@map("workflow_steps")
}

// ============================
// WORKFLOW INSTANCE (a running approval on a real entity)
// ============================

model WorkflowInstance {
  id                String                  @id @default(uuid())
  tenantId          String                  @map("tenant_id")
  workflowRuleId    String                  @map("workflow_rule_id")

  entityType        String                  @map("entity_type")   // e.g. "BrandOrder", "VendorKyc"
  entityId          String                  @map("entity_id")     // polymorphic reference — no FK, resolved at app level

  status            WorkflowInstanceStatus  @default(PENDING)
  currentStepOrder  Int                     @default(1) @map("current_step_order")

  initiatedById     String                  @map("initiated_by_id")

  createdAt         DateTime                @default(now()) @map("created_at")
  updatedAt         DateTime                @updatedAt @map("updated_at")

  tenant            Tenant       @relation(fields: [tenantId], references: [id])
  workflowRule      WorkflowRule @relation(fields: [workflowRuleId], references: [id])
  initiatedBy       User         @relation(fields: [initiatedById], references: [id])
  actions           ApprovalAction[]

  @@index([tenantId, status])
  @@index([entityType, entityId])
  @@map("workflow_instances")
}

// ============================
// APPROVAL ACTION (history — every approve/reject/escalate)
// ============================

model ApprovalAction {
  id                  String            @id @default(uuid())
  workflowInstanceId  String            @map("workflow_instance_id")
  workflowStepId      String            @map("workflow_step_id")

  actionByUserId      String?           @map("action_by_user_id")   // null if system-escalated
  decision            ApprovalDecision
  remarks             String?

  createdAt           DateTime          @default(now()) @map("created_at")

  workflowInstance    WorkflowInstance  @relation(fields: [workflowInstanceId], references: [id], onDelete: Cascade)
  workflowStep        WorkflowStep      @relation(fields: [workflowStepId], references: [id])
  actionByUser        User?             @relation(fields: [actionByUserId], references: [id])

  @@index([workflowInstanceId])
  @@map("approval_actions")
}
```

**Design notes:**
- **Polymorphic reference** (`entityType` + `entityId`, no FK) — deliberate choice. Once Brand/Vendor/Order models exist (Module 3, 4), a real FK per entity type would mean a separate `WorkflowInstance` variant per module. Keeping it generic means this table never needs to change again.
- **Steps tied to Role, not User** — if the Business Head changes next month, the workflow doesn't break; whoever holds that role approves.
- **`escalationRoleId` per step** — different steps can escalate to different roles (e.g. Step 1 escalates to Step 2's approver, Step 2 escalates to Admin).
- **`ApprovalAction.actionByUserId` is nullable** — system-triggered escalations (via cron job) won't have a human actor.

---

## 3. API Endpoints

### 3.1 Workflow Rule Configuration (Admin)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/workflows` | Create workflow rule |
| GET | `/api/v1/workflows` | List all workflow rules |
| GET | `/api/v1/workflows/:id` | Get rule with its steps |
| PATCH | `/api/v1/workflows/:id` | Update rule |
| DELETE | `/api/v1/workflows/:id` | Soft-delete rule |
| POST | `/api/v1/workflows/:id/steps` | Add a step |
| PATCH | `/api/v1/workflows/:id/steps/:stepId` | Update a step |
| DELETE | `/api/v1/workflows/:id/steps/:stepId` | Remove a step |

### 3.2 Workflow Instance (Runtime)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/workflow-instances` | Start a new approval instance (called internally by other modules) |
| GET | `/api/v1/workflow-instances` | List instances (filter by status, entityType) |
| GET | `/api/v1/workflow-instances/pending` | **Pending Approval Dashboard** — items awaiting the current user's role |
| GET | `/api/v1/workflow-instances/:id` | Get instance with full history |
| POST | `/api/v1/workflow-instances/:id/approve` | Approve current step |
| POST | `/api/v1/workflow-instances/:id/reject` | Reject (requires remarks) |
| POST | `/api/v1/workflow-instances/:id/resubmit` | Re-submit after rejection (resets to step 1) |

---

## 4. NestJS Module Structure

```
apps/backend/src/modules/
  workflow-rule/
    workflow-rule.module.ts
    workflow-rule.controller.ts
    workflow-rule.service.ts
    dto/
      create-workflow-rule.dto.ts
      update-workflow-rule.dto.ts
      create-workflow-step.dto.ts

  workflow-instance/
    workflow-instance.module.ts
    workflow-instance.controller.ts
    workflow-instance.service.ts
    dto/
      start-workflow.dto.ts
      approval-action.dto.ts
    jobs/
      escalation.processor.ts        ← BullMQ cron job, checks overdue instances
```

---

## 5. Core Service Logic (key methods)

**`WorkflowInstanceService.start()`** — called by other modules (e.g. Brand Portal when a new order needs approval):
```typescript
async start(tenantId: string, workflowModule: string, entityType: string, entityId: string, initiatedById: string) {
  const rule = await this.prisma.workflowRule.findFirst({
    where: { tenantId, module: workflowModule, isActive: true },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });

  if (!rule) throw new NotFoundException('No active workflow configured for this module');

  // Auto-approve path — no steps needed
  if (rule.autoApprove || rule.steps.length === 0) {
    return this.prisma.workflowInstance.create({
      data: {
        tenantId, workflowRuleId: rule.id, entityType, entityId,
        initiatedById, status: 'APPROVED', currentStepOrder: 0,
      },
    });
  }

  return this.prisma.workflowInstance.create({
    data: {
      tenantId, workflowRuleId: rule.id, entityType, entityId,
      initiatedById, status: 'PENDING', currentStepOrder: 1,
    },
  });
}
```

**`WorkflowInstanceService.approve()`** — moves to next step, or marks fully APPROVED if last step:
```typescript
async approve(tenantId: string, instanceId: string, userId: string, userRoleId: string, remarks?: string) {
  const instance = await this.getActiveInstance(tenantId, instanceId);
  const currentStep = await this.getStepForOrder(instance.workflowRuleId, instance.currentStepOrder);

  if (currentStep.approverRoleId !== userRoleId) {
    throw new ForbiddenException('You are not the approver for this step');
  }

  await this.prisma.approvalAction.create({
    data: {
      workflowInstanceId: instance.id,
      workflowStepId: currentStep.id,
      actionByUserId: userId,
      decision: 'APPROVED',
      remarks,
    },
  });

  const nextStep = await this.getStepForOrder(instance.workflowRuleId, instance.currentStepOrder + 1);

  return this.prisma.workflowInstance.update({
    where: { id: instance.id },
    data: nextStep
      ? { currentStepOrder: instance.currentStepOrder + 1 }
      : { status: 'APPROVED' },
  });
}
```

**`WorkflowInstanceService.reject()`** — marks REJECTED, entity-owning module reacts to status via webhook/event or by polling.

**`getPending(tenantId, userRoleId)`** — powers the Pending Approval Dashboard:
```typescript
async getPending(tenantId: string, userRoleId: string) {
  // Find instances where current step's approver role matches the requesting user's role
  return this.prisma.workflowInstance.findMany({
    where: {
      tenantId,
      status: 'PENDING',
      workflowRule: {
        steps: { some: { approverRoleId: userRoleId } },
      },
    },
    include: { workflowRule: { include: { steps: true } }, actions: true },
  });
}
```
*(Refined at implementation time to match `currentStepOrder` exactly, not just "any step" — shown simplified here.)*

---

## 6. Escalation Job (Background)

Runs on a schedule (e.g. every 30 minutes via BullMQ repeatable job):

```typescript
// Pseudocode
async checkOverdueInstances() {
  const pending = await this.prisma.workflowInstance.findMany({
    where: { status: 'PENDING' },
    include: { workflowRule: true },
  });

  for (const instance of pending) {
    const rule = instance.workflowRule;
    if (!rule.escalationHours) continue;

    const hoursSinceLastAction = /* calculate from last ApprovalAction or createdAt */;
    if (hoursSinceLastAction >= rule.escalationHours) {
      const currentStep = await this.getStepForOrder(rule.id, instance.currentStepOrder);
      if (!currentStep.escalationRoleId) continue;

      await this.prisma.approvalAction.create({
        data: {
          workflowInstanceId: instance.id,
          workflowStepId: currentStep.id,
          decision: 'ESCALATED',
          remarks: `Auto-escalated after ${rule.escalationHours}h`,
        },
      });
      // Notify escalationRole users (Module 8: Notifications, once built)
    }
  }
}
```

---

## 7. How Other Modules Will Use This (preview)

When Module 3 (Brand Portal) is built, a Brand order needing approval will simply call:
```typescript
await workflowInstanceService.start(tenantId, 'brand_order', 'BrandOrder', order.id, userId);
```
No changes needed in this module — this is the payoff of the polymorphic design.

---

## 8. Open Items Before Coding Starts

- Confirm: can a `WorkflowRule` per `module` be **only one active at a time** per tenant (current schema assumes yes, via `@@unique([tenantId, module])`)?
- Confirm: on rejection, should the entity go back to the initiator for edits (Resubmission), or is it a dead-end?
- Escalation notification channel (Email/SMS/in-app) — depends on Module 8, can stub for now

---

## Next Step

Once this is implemented and tested, we move to **Module 3: Brand Portal** — this is also where the `BusinessProfile` model (PAN/GST/MSME) gets finalized, and Brand self-registration will call into this Workflow Engine for approval.
