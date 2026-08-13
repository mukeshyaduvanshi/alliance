import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VendorJwtAuthGuard } from '../vendor/guards/vendor-jwt-auth.guard';
import { RateService } from './rate.service';
import { SetOwnRateDto } from './dto/set-own-rate.dto';

@UseGuards(VendorJwtAuthGuard)
@Controller('vendor/rates')
export class VendorOwnRateController {
  constructor(private rateService: RateService) {}

  @Get()
  list(@Req() req: any) {
    return this.rateService.listRatesForVendor(
      req.user.tenantId,
      req.user.vendorId,
    );
  }

  @Patch(':rateId/region/:region')
  setOwn(
    @Req() req: any,
    @Param('rateId') rateId: string,
    @Param('region') region: string,
    @Body() dto: Omit<SetOwnRateDto, 'region'>,
  ) {
    return this.rateService.setVendorRate(
      req.user.tenantId,
      req.user.vendorId,
      rateId,
      { ...dto, region: region as any },
    );
  }
}
