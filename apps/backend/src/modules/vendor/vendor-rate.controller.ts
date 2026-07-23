import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { VendorJwtAuthGuard } from './guards/vendor-jwt-auth.guard';
import { VendorRateService } from './vendor-rate.service';
import { SelectRateDto } from './dto/select-rate.dto';

@UseGuards(VendorJwtAuthGuard)
@Controller('vendor/products')
export class VendorRateController {
  constructor(private vendorRateService: VendorRateService) {}

  @Get()
  browse(@Req() req: any) {
    return this.vendorRateService.browseProducts(req.user.tenantId);
  }

  @Post('select-rate')
  selectRate(@Req() req: any, @Body() dto: SelectRateDto) {
    return this.vendorRateService.selectRate(
      req.user.tenantId,
      req.user.vendorId,
      dto,
    );
  }

  @Get('my-rates')
  myRates(@Req() req: any) {
    return this.vendorRateService.listOwnRates(req.user.vendorId);
  }
}
