import { AlertSeverity, AlertType, OrderStatus } from "../enums";

export interface SlaRuleDto {
  id: string;
  tenantId: string;
  name: string;
  appliesToStatus: OrderStatus;
  thresholdHours: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateSlaRuleDto {
  name: string;
  appliesToStatus: OrderStatus;
  thresholdHours: number;
  isActive?: boolean;
}

export interface ExceptionAlertDto {
  id: string;
  tenantId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  entityType: string;
  entityId: string;
  isResolved: boolean;
  resolvedById?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface ResolveAlertDto {
  id: string;
}
