import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BrandJwtAuthGuard } from '../brand/guards/brand-jwt-auth.guard';
import { RateService } from './rate.service';
import { SetOwnRateDto } from './dto/set-own-rate.dto';

@UseGuards(BrandJwtAuthGuard)
@Controller('brand/rates')
export class BrandOwnRateController {
  constructor(private rateService: RateService) {}

  @Get()
  list(@Req() req: any) {
    return this.rateService.listRatesForBrand(
      req.user.tenantId,
      req.user.brandId,
    );
  }

  @Patch(':rateId/region/:region')
  setOwn(
    @Req() req: any,
    @Param('rateId') rateId: string,
    @Param('region') region: string,
    @Body() dto: Omit<SetOwnRateDto, 'region'>,
  ) {
    return this.rateService.setBrandRate(
      req.user.tenantId,
      req.user.brandId,
      rateId,
      { ...dto, region: region as any },
    );
  }

  @Delete(':rateId')
  deleteOwn(@Req() req: any, @Param('rateId') rateId: string) {
    return this.rateService.deleteBrandRate(
      req.user.tenantId,
      req.user.brandId,
      rateId,
    );
  }
}
