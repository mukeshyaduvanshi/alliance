import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { BrandController } from '../brand/brand.controller';
import { OrderService } from './order.service';
import { BrandOrderController } from './brand-order.controller';

@Module({
  controllers: [OrderController, BrandOrderController],
  providers: [OrderService],
})
export class OrderModule {}
