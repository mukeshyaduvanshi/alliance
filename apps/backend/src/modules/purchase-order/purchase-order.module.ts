import { Module } from '@nestjs/common';
import { PurchaseOrderController } from './purchase-order.controller';
import { PurchaseOrderStatusController } from './purchase-order-status.controller';
import { BrandPurchaseOrderController } from './brand-purchase-order.controller';
import { PurchaseOrderService } from './purchase-order.service';

@Module({
  controllers: [
    PurchaseOrderController,
    PurchaseOrderStatusController,
    BrandPurchaseOrderController,
  ],
  providers: [PurchaseOrderService],
})
export class PurchaseOrderModule {}
