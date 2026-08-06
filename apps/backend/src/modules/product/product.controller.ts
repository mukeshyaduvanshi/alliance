import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateRegionRatesDto } from './dto/update-region-rates.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @RequirePermission('product', 'CREATE')
  @Post()
  create(@Req() req: any, @Body() dto: CreateProductDto) {
    return this.productService.create(req.user.tenantId, dto);
  }

  @RequirePermission('product', 'VIEW')
  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.productService.findAll(req.user.tenantId, page, pageSize);
  }

  @RequirePermission('product', 'VIEW')
  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.productService.findOne(req.user.tenantId, id);
  }

  @RequirePermission('product', 'EDIT')
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(req.user.tenantId, id, dto);
  }

  @RequirePermission('product', 'DELETE')
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.productService.remove(req.user.tenantId, id);
  }

  @RequirePermission('product', 'EDIT')
  @Patch(':id/region-rates')
  updateBrandRegionRates(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateRegionRatesDto,
  ) {
    return this.productService.updateBrandRegionRates(
      req.user.tenantId,
      id,
      dto.regionRates,
    );
  }

  @RequirePermission('product', 'EDIT')
  @Patch(':id/vendor-region-rates')
  updateVendorRegionRates(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateRegionRatesDto,
  ) {
    return this.productService.updateVendorRegionRates(
      req.user.tenantId,
      id,
      dto.regionRates,
    );
  }
}
