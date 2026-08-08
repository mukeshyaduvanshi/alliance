import { BackupStatus, LogLevel, SubscriptionStatus } from "../enums";

export interface SubscriptionPlanDto {
  id: string;
  name: string;
  maxUsers: number;
  maxBrands: number;
  maxVendors: number;
  priceMonthly: string;
  isActive: boolean;
  createdAt: string;
}

export interface LicenseDto {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  expiryDate: string;
  createdAt: string;
  plan?: { id: string; name: string };
  tenant?: { id: string; name: string };
}

export interface ErrorLogDto {
  id: string;
  tenantId?: string | null;
  level: LogLevel;
  message: string;
  stackTrace?: string | null;
  path?: string | null;
  method?: string | null;
  userId?: string | null;
  createdAt: string;
}

export interface EmailLogDto {
  id: string;
  tenantId: string;
  toAddress: string;
  subject: string;
  status: string;
  errorMessage?: string | null;
  createdAt: string;
}

export interface SmsLogDto {
  id: string;
  tenantId: string;
  toPhone: string;
  message: string;
  status: string;
  errorMessage?: string | null;
  createdAt: string;
}

export interface BackupLogDto {
  id: string;
  tenantId: string;
  status: BackupStatus;
  fileSizeMb?: number | null;
  errorMessage?: string | null;
  startedAt: string;
  completedAt?: string | null;
}

export type QueueJobStatus =
  | "waiting"
  | "active"
  | "delayed"
  | "failed"
  | "completed"
  | "paused"
  | "prioritized";

export interface QueueOverviewDto {
  name: string;
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
  completed: number;
}

export interface QueueJobDto {
  id: string;
  name: string;
  data: Record<string, unknown>;
  status: QueueJobStatus;
  attemptsMade: number;
  failedReason?: string | null;
  timestamp: number | null;
  processedOn?: number | null;
  finishedOn?: number | null;
}
