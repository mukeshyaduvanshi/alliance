import {
  Body,
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { SystemAdminService } from './system-admin.service';
import { QueueMonitorService } from '../queue-monitor/queue-monitor.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { CreateLicenseDto } from './dto/create-license.dto';
import { LogBackupDto } from './dto/log-backup.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('system')
export class SystemAdminController {
  constructor(
    private systemAdminService: SystemAdminService,
    private queueMonitorService: QueueMonitorService,
  ) {}

  @RequirePermission('system_admin', 'VIEW')
  @Get('health')
  getHealth() {
    return this.systemAdminService.getHealth();
  }

  @RequirePermission('system_admin', 'VIEW')
  @Get('error-logs')
  listErrorLogs(@Req() req: any, @Query('level') level?: string) {
    return this.systemAdminService.listErrorLogs(req.user.tenantId, level);
  }

  @RequirePermission('system_admin', 'VIEW')
  @Get('cache/keys')
  listCacheKeys(@Query('pattern') pattern?: string) {
    return this.systemAdminService.listCacheKeys(pattern);
  }

  @RequirePermission('system_admin', 'DELETE')
  @Delete('cache/:key')
  deleteCacheKey(@Param('key') key: string) {
    return this.systemAdminService.deleteCacheKey(key);
  }

  @RequirePermission('system_admin', 'DELETE')
  @Delete('cache')
  flushCache() {
    return this.systemAdminService.flushAllCache();
  }

  @RequirePermission('system_admin', 'CREATE')
  @Post('backups')
  logBackup(@Req() req: any, @Body() dto: LogBackupDto) {
    return this.systemAdminService.logBackup(req.user.tenantId, dto);
  }

  @RequirePermission('system_admin', 'VIEW')
  @Get('backups')
  listBackups(@Req() req: any) {
    return this.systemAdminService.listBackups(req.user.tenantId);
  }

  @RequirePermission('system_admin', 'CREATE')
  @Post('subscription-plans')
  createPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.systemAdminService.createPlan(dto);
  }

  @RequirePermission('system_admin', 'VIEW')
  @Get('subscription-plans')
  listPlans() {
    return this.systemAdminService.listPlans();
  }

  @RequirePermission('system_admin', 'CREATE')
  @Post('licenses')
  createLicense(@Req() req: any, @Body() dto: CreateLicenseDto) {
    return this.systemAdminService.createLicense(req.user.tenantId, dto);
  }

  @RequirePermission('system_admin', 'VIEW')
  @Get('licenses')
  getLicense(@Req() req: any) {
    return this.systemAdminService.getLicense(req.user.tenantId);
  }

  @RequirePermission('system_admin', 'VIEW')
  @Get('email-logs')
  listEmailLogs(@Req() req: any) {
    return this.systemAdminService.listEmailLogs(req.user.tenantId);
  }

  @RequirePermission('system_admin', 'VIEW')
  @Get('sms-logs')
  listSmsLogs(@Req() req: any) {
    return this.systemAdminService.listSmsLogs(req.user.tenantId);
  }

  @RequirePermission('system_admin', 'VIEW')
  @Get('queues')
  queueOverview() {
    return this.queueMonitorService.getOverview();
  }

  @RequirePermission('system_admin', 'VIEW')
  @Get('queues/:name/jobs')
  queueJobs(
    @Param('name') name: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.queueMonitorService.getJobs(
      name,
      status as any,
      Number(page) || 1,
      Math.min(100, Math.max(1, Number(pageSize) || 20)),
    );
  }

  @RequirePermission('system_admin', 'EDIT')
  @Post('queues/:name/jobs/:id/retry')
  retryQueueJob(@Param('name') name: string, @Param('id') id: string) {
    return this.queueMonitorService.retryJob(name, id);
  }

  @RequirePermission('system_admin', 'DELETE')
  @Delete('queues/:name/jobs/:id')
  removeQueueJob(@Param('name') name: string, @Param('id') id: string) {
    return this.queueMonitorService.removeJob(name, id);
  }
}
