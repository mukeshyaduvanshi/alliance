import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ProductService } from './product.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('product-categories')
export class ProductCategoryController {
  constructor(private productService: ProductService) {}

  @RequirePermission('product', 'CREATE')
  @Post()
  create(@Req() req: any, @Body() dto: CreateCategoryDto) {
    return this.productService.createCategory(req.user.tenantId, dto);
  }

  @RequirePermission('product', 'VIEW')
  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.productService.findAllCategories(
      req.user.tenantId,
      page,
      pageSize,
    );
  }
}
