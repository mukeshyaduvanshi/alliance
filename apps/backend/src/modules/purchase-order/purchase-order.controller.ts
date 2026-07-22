import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PurchaseOrderService } from './purchase-order.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('brands/:brandId/purchase-orders')
export class PurchaseOrderController {
  constructor(private poService: PurchaseOrderService) {}

  @RequirePermission('purchase_order', 'CREATE')
  @Post()
  create(
    @Req() req: any,
    @Param('brandId') brandId: string,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.poService.create(
      req.user.tenantId,
      brandId,
      dto,
      req.user.userId,
    );
  }

  @RequirePermission('purchase_order', 'VIEW')
  @Get()
  findAll(@Req() req: any, @Param('brandId') brandId: string) {
    return this.poService.findAllForBrand(req.user.tenantId, brandId);
  }
}
