import { Module } from '@nestjs/common';
import { PurchaseOrderController } from './purchase-order.controller';
import { PurchaseOrderStatusController } from './purchase-order-status.controller';
import { PurchaseOrderService } from './purchase-order.service';

@Module({
  controllers: [PurchaseOrderController, PurchaseOrderStatusController],
  providers: [PurchaseOrderService],
})
export class PurchaseOrderModule {}
