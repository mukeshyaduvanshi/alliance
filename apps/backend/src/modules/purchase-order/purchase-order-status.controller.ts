import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PurchaseOrderService } from './purchase-order.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchase-orders')
export class PurchaseOrderStatusController {
  constructor(private poService: PurchaseOrderService) {}

  @RequirePermission('purchase_order', 'VIEW')
  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.poService.findAll(req.user.tenantId, page, pageSize);
  }

  @RequirePermission('purchase_order', 'EDIT')
  @Patch(':id/status')
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.poService.updateStatus(req.user.tenantId, id, isActive);
  }
}
