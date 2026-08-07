import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BrandJwtAuthGuard } from '../brand/guards/brand-jwt-auth.guard';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';

@UseGuards(BrandJwtAuthGuard)
@Controller('brand/orders')
export class BrandOrderController {
  constructor(private orderService: OrderService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.orderService.placeOrder(
      req.user.tenantId,
      req.user.brandId,
      dto,
    );
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.orderService.findAllForBrand(
      req.user.brandId,
      status,
      page,
      pageSize,
    );
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.orderService.findOneForBrand(req.user.brandId, id);
  }

  @Post(':id/approve-artwork')
  approve(@Req() req: any, @Param('id') id: string) {
    return this.orderService.approveArtwork(
      req.user.tenantId,
      id,
      req.user.brandId,
    );
  }

  @Post(':id/reject-artwork')
  reject(@Req() req: any, @Param('id') id: string) {
    return this.orderService.rejectArtwork(
      req.user.tenantId,
      id,
      req.user.brandId,
    );
  }

  @Post(':id/cancel')
  cancel(@Req() req: any, @Param('id') id: string) {
    return this.orderService.cancelOrder(
      req.user.tenantId,
      id,
      req.user.brandId,
    );
  }
}
