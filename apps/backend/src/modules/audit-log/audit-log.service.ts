import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActorType, AuditAction, Prisma } from '@database/database';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

export interface LogEntryInput {
  tenantId?: string;
  actorType: ActorType;
  actorId?: string;
  actorName?: string;
  action: AuditAction;
  module: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  // Core logging method — called from everywhere (interceptor + explicit calls)
  async log(entry: LogEntryInput) {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: entry.tenantId,
          actorType: entry.actorType,
          actorId: entry.actorId,
          actorName: entry.actorName,
          action: entry.action,
          module: entry.module,
          entityType: entry.entityType,
          entityId: entry.entityId,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          metadata: entry.metadata as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      // Never let audit logging failure break the actual request
      console.error('Failed to write audit log:', err);
    }
  }

  async query(
    tenantId: string,
    dto: QueryAuditLogDto,
    page = 1,
    pageSize = 50,
  ) {
    const where: any = { tenantId };

    if (dto.module) where.module = dto.module;
    if (dto.actorType) where.actorType = dto.actorType;
    if (dto.actorId) where.actorId = dto.actorId;
    if (dto.action) where.action = dto.action;
    if (dto.fromDate || dto.toDate) {
      where.createdAt = {};
      if (dto.fromDate) where.createdAt.gte = new Date(dto.fromDate);
      if (dto.toDate) where.createdAt.lte = new Date(dto.toDate);
    }
    if (dto.search) {
      where.OR = [
        { actorName: { contains: dto.search, mode: 'insensitive' } },
        { module: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async exportAsCsv(tenantId: string, dto: QueryAuditLogDto): Promise<string> {
    const { data } = await this.query(tenantId, dto, 1, 10000); // cap for a single export

    const headers = [
      'Date',
      'Actor Type',
      'Actor Name',
      'Action',
      'Module',
      'Entity Type',
      'Entity ID',
      'IP Address',
    ];
    const rows = data.map((log) => [
      log.createdAt.toISOString(),
      log.actorType,
      log.actorName ?? '',
      log.action,
      log.module,
      log.entityType ?? '',
      log.entityId ?? '',
      log.ipAddress ?? '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');
    return csv;
  }
}
