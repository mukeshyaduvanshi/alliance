import {
  Body,
  Controller,
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
import { OrderService } from './order.service';
import { SubmitArtworkDto } from './dto/submit-artwork.dto';
import { AssignVendorDto } from './dto/assign-vendor.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @RequirePermission('order', 'VIEW')
  @Get()
  findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('brandId') brandId?: string,
    @Query('vendorId') vendorId?: string,
  ) {
    return this.orderService.findAll(
      req.user.tenantId,
      status,
      brandId,
      vendorId,
    );
  }

  @RequirePermission('order', 'VIEW')
  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.orderService.findOne(req.user.tenantId, id);
  }

  @RequirePermission('creative_artwork', 'CREATE')
  @Post(':id/creative-artwork')
  submitArtwork(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SubmitArtworkDto,
  ) {
    return this.orderService.submitCreativeArtwork(
      req.user.tenantId,
      id,
      req.user.userId,
      dto,
    );
  }

  @RequirePermission('vendor_assignment', 'EDIT')
  @Post(':id/assign-vendor')
  assignVendor(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AssignVendorDto,
  ) {
    return this.orderService.assignVendor(req.user.tenantId, id, dto.vendorId);
  }

  @RequirePermission('order', 'EDIT')
  @Patch(':id/status')
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(req.user.tenantId, id, dto.status);
  }
}
