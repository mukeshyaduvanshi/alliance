import { Module } from '@nestjs/common';
import { RateService } from './rate.service';
import { RateController } from './rate.controller';
import { BrandOwnRateController } from './brand-own-rate.controller';
import { VendorOwnRateController } from './vendor-own-rate.controller';

@Module({
  controllers: [
    RateController,
    BrandOwnRateController,
    VendorOwnRateController,
  ],
  providers: [RateService],
  exports: [RateService],
})
export class RateModule {}
