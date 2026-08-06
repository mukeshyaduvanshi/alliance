import { ActorType, AuditAction } from "../enums";

export interface AuditLogDto {
  id: string;
  tenantId?: string | null;
  actorType: ActorType;
  actorId?: string | null;
  actorName?: string | null;
  action: AuditAction;
  module: string;
  entityType?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogQuery {
  page?: number;
  perPage?: number;
  module?: string;
  action?: AuditAction;
  actorType?: ActorType;
  actorId?: string;
  from?: string;
  to?: string;
  q?: string;
}
