import { Controller, Get, Query, Res, Req, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { AuditLogService } from './audit-log.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit-logs')
export class AuditLogController {
  constructor(private auditLogService: AuditLogService) {}

  @RequirePermission('audit_log', 'VIEW')
  @Get()
  query(
    @Req() req: any,
    @Query() dto: QueryAuditLogDto,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.auditLogService.query(
      req.user.tenantId,
      dto,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 50,
    );
  }

  @RequirePermission('audit_log', 'EXPORT')
  @Get('export')
  async export(
    @Req() req: any,
    @Query() dto: QueryAuditLogDto,
    @Res() res: Response,
  ) {
    const csv = await this.auditLogService.exportAsCsv(req.user.tenantId, dto);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="audit-logs.csv"',
    );
    res.send(csv);

    // Log the export action itself (Data Export tracking, per PRD requirement)
    await this.auditLogService.log({
      tenantId: req.user.tenantId,
      actorType: 'INTERNAL_USER',
      actorId: req.user.userId,
      action: 'DATA_EXPORT',
      module: 'audit_log',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }
}
