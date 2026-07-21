import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { BrandRateService } from './brand-rate.service';
import { ProductController } from './product.controller';
import { ProductCategoryController } from './product-category.controller';
import { BrandRateController } from './brand-rate.controller';
import { BrandProductController } from './brand-product.controller';

@Module({
  controllers: [
    ProductController,
    ProductCategoryController,
    BrandRateController,
    BrandProductController,
  ],
  providers: [ProductService, BrandRateService],
})
export class ProductModule {}
