import {
  Body,
  Controller,
  Delete,
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
import { AssignManagersDto } from './dto/assign-managers.dto';

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
  listSlaRules(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.monitoringService.listSlaRules(
      req.user.tenantId,
      page,
      pageSize,
    );
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

  @RequirePermission('brand', 'VIEW')
  @Get('brands/:brandId/managers')
  listBrandManagers(@Req() req: any, @Param('brandId') brandId: string) {
    return this.monitoringService.listBrandManagers(
      req.user.tenantId,
      brandId,
    );
  }

  @RequirePermission('brand', 'EDIT')
  @Post('brands/:brandId/managers')
  assignManagers(
    @Req() req: any,
    @Param('brandId') brandId: string,
    @Body() dto: AssignManagersDto,
  ) {
    return this.monitoringService.assignManagers(
      req.user.tenantId,
      brandId,
      dto.userIds,
      req.user.userId,
    );
  }

  @RequirePermission('brand', 'EDIT')
  @Delete('brands/:brandId/managers/:userId')
  removeManager(
    @Req() req: any,
    @Param('brandId') brandId: string,
    @Param('userId') userId: string,
  ) {
    return this.monitoringService.removeManager(
      req.user.tenantId,
      brandId,
      userId,
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
  listAlerts(
    @Req() req: any,
    @Query('isResolved') isResolved?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const resolved =
      isResolved === undefined ? undefined : isResolved === 'true';
    return this.monitoringService.listAlerts(
      req.user.tenantId,
      resolved,
      page,
      pageSize,
    );
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
