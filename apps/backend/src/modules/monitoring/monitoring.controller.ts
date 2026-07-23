import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { MonitoringService } from './monitoring.service';
import { CreateSlaRuleDto } from './dto/create-sla-rule.dto';
import { AssignKamDto } from './dto/assign-kam.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class MonitoringController {
  constructor(private monitoringService: MonitoringService) {}

  @RequirePermission('sla_rule', 'CREATE')
  @Post('sla-rules')
  createSlaRule(@Req() req: any, @Body() dto: CreateSlaRuleDto) {
    return this.monitoringService.createSlaRule(req.user.tenantId, dto);
  }

  @RequirePermission('sla_rule', 'VIEW')
  @Get('sla-rules')
  listSlaRules(@Req() req: any) {
    return this.monitoringService.listSlaRules(req.user.tenantId);
  }

  @RequirePermission('brand', 'EDIT')
  @Patch('brands/:brandId/assign-kam')
  assignKam(
    @Req() req: any,
    @Param('brandId') brandId: string,
    @Body() dto: AssignKamDto,
  ) {
    return this.monitoringService.assignKam(
      req.user.tenantId,
      brandId,
      dto.kamUserId,
    );
  }

  @RequirePermission('dashboard', 'VIEW')
  @Get('dashboard/kam')
  kamDashboard(@Req() req: any) {
    return this.monitoringService.getKamDashboard(
      req.user.tenantId,
      req.user.userId,
    );
  }

  @RequirePermission('dashboard', 'VIEW')
  @Get('dashboard/performance')
  performanceDashboard(@Req() req: any) {
    return this.monitoringService.getPerformanceDashboard(req.user.tenantId);
  }

  @RequirePermission('dashboard', 'VIEW')
  @Get('dashboard/sla-status')
  slaStatus(@Req() req: any) {
    return this.monitoringService.getBreachedOrders(req.user.tenantId);
  }

  @RequirePermission('alert', 'VIEW')
  @Get('alerts')
  listAlerts(@Req() req: any, @Query('isResolved') isResolved?: string) {
    const resolved =
      isResolved === undefined ? undefined : isResolved === 'true';
    return this.monitoringService.listAlerts(req.user.tenantId, resolved);
  }

  @RequirePermission('alert', 'EDIT')
  @Patch('alerts/:id/resolve')
  resolveAlert(@Req() req: any, @Param('id') id: string) {
    return this.monitoringService.resolveAlert(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }
}
