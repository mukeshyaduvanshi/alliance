import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { BrandJwtAuthGuard } from '../brand/guards/brand-jwt-auth.guard';
import { BrandRateService } from './brand-rate.service';

@UseGuards(BrandJwtAuthGuard)
@Controller('brand/products')
export class BrandProductController {
  constructor(private brandRateService: BrandRateService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.brandRateService.findProductsForBrand(
      req.user.brandId,
      page,
      pageSize,
    );
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.brandRateService.findOneForBrand(req.user.brandId, id);
  }
}
