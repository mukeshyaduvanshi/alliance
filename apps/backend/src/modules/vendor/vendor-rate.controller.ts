import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VendorJwtAuthGuard } from './guards/vendor-jwt-auth.guard';
import { VendorRateService } from './vendor-rate.service';
import { SelectRateDto } from './dto/select-rate.dto';
import { SetVendorRateDto } from './dto/set-vendor-rate.dto';

@UseGuards(VendorJwtAuthGuard)
@Controller('vendor/products')
export class VendorRateController {
  constructor(private vendorRateService: VendorRateService) {}

  @Get()
  browse(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.vendorRateService.browseProducts(
      req.user.tenantId,
      page,
      pageSize,
    );
  }

  @Post('select-rate')
  selectRate(@Req() req: any, @Body() dto: SelectRateDto) {
    return this.vendorRateService.selectRate(
      req.user.tenantId,
      req.user.vendorId,
      dto,
    );
  }

  @Patch(':id/rate')
  setOwnRate(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SetVendorRateDto,
  ) {
    return this.vendorRateService.setOwnRate(req.user.vendorId, id, dto);
  }

  @Get('my-rates')
  myRates(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.vendorRateService.listOwnRates(
      req.user.vendorId,
      page,
      pageSize,
    );
  }
}
