import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { BrandController } from '../brand/brand.controller';
import { OrderService } from './order.service';
import { BrandOrderController } from './brand-order.controller';
import { OrderNegotiationService } from './order-negotiation.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [OrderController, BrandOrderController],
  providers: [OrderService, OrderNegotiationService],
  exports: [OrderNegotiationService],
})
export class OrderModule {}
