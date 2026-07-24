import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { BusinessModelService } from './business-model.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('business-models')
export class BusinessModelListController {
  constructor(private businessModelService: BusinessModelService) {}

  @RequirePermission('business_model', 'VIEW')
  @Get()
  listAll(@Req() req: any) {
    return this.businessModelService.listAll(req.user.tenantId);
  }
}
