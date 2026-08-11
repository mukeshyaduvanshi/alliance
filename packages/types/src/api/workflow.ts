import { ApprovalDecision, WorkflowInstanceStatus } from "../enums";

export interface WorkflowModuleDto {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowModuleDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface WorkflowStepDto {
  id: string;
  workflowRuleId: string;
  stepOrder: number;
  approverRoleId: string;
  escalationRoleId?: string | null;
  isOptional: boolean;
  approverRole?: { id: string; name: string };
  escalationRole?: { id: string; name: string };
}

export interface WorkflowRuleDto {
  id: string;
  tenantId: string;
  name: string;
  module: string;
  description?: string | null;
  isActive: boolean;
  autoApprove: boolean;
  escalationHours?: number | null;
  steps: WorkflowStepDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowRuleDto {
  name: string;
  module: string;
  description?: string;
  isActive?: boolean;
  autoApprove?: boolean;
  escalationHours?: number;
  steps: { stepOrder: number; approverRoleId: string; escalationRoleId?: string; isOptional?: boolean }[];
}

export interface UpdateWorkflowRuleDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  autoApprove?: boolean;
  escalationHours?: number;
  steps?: CreateWorkflowRuleDto["steps"];
}

export interface WorkflowInstanceDto {
  id: string;
  tenantId: string;
  workflowRuleId: string;
  entityType: string;
  entityId: string;
  status: WorkflowInstanceStatus;
  currentStepOrder: number;
  initiatedById?: string | null;
  initiatedBy?: { id: string; fullName: string };
  workflowRule?: { id: string; name: string; module: string };
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalActionDto {
  id: string;
  workflowInstanceId: string;
  workflowStepId: string;
  actionByUserId?: string | null;
  actionByUser?: { id: string; fullName: string };
  decision: ApprovalDecision;
  remarks?: string | null;
  createdAt: string;
}

export interface ApprovalActionInput {
  decision: ApprovalDecision;
  remarks?: string;
}
