import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { BrandJwtAuthGuard } from '../brand/guards/brand-jwt-auth.guard';
import { PurchaseOrderService } from './purchase-order.service';

@UseGuards(BrandJwtAuthGuard)
@Controller('brand/purchase-orders')
export class BrandPurchaseOrderController {
  constructor(private poService: PurchaseOrderService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.poService.findAllForBrand(
      req.user.tenantId,
      req.user.brandId,
      page,
      pageSize,
    );
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.poService.findOneForBrand(req.user.tenantId, req.user.brandId, id);
  }
}
