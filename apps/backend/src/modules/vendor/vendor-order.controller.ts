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
import { VendorJwtAuthGuard } from './guards/vendor-jwt-auth.guard';
import { OrderNegotiationService } from '../order/order-negotiation.service';
import { ProposeNegotiationDto } from '../order/dto/propose-negotiation.dto';

@UseGuards(VendorJwtAuthGuard)
@Controller('vendor/orders')
export class VendorOrderController {
  constructor(private negotiationService: OrderNegotiationService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.negotiationService.findAllForVendor(
      req.user.vendorId,
      status,
      page,
      pageSize,
    );
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.negotiationService.findOneForVendor(req.user.vendorId, id);
  }

  @Post(':id/negotiate')
  negotiate(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ProposeNegotiationDto,
  ) {
    return this.negotiationService.propose(
      req.user.tenantId,
      id,
      req.user.vendorId,
      dto,
    );
  }
}
