import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { BrandRateService } from './brand-rate.service';
import { AssignRateDto } from './dto/assign-rate.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('brands/:brandId/rates')
export class BrandRateController {
  constructor(private brandRateService: BrandRateService) {}

  @RequirePermission('rate', 'EDIT')
  @Post()
  assign(
    @Req() req: any,
    @Param('brandId') brandId: string,
    @Body() dto: AssignRateDto,
  ) {
    return this.brandRateService.assignRate(
      req.user.tenantId,
      brandId,
      dto,
      req.user.userId,
    );
  }

  @RequirePermission('rate', 'VIEW')
  @Get()
  findAll(@Req() req: any, @Param('brandId') brandId: string) {
    return this.brandRateService.listForBrandAdmin(req.user.tenantId, brandId);
  }

  @RequirePermission('rate', 'DELETE')
  @Delete(':productId')
  remove(
    @Req() req: any,
    @Param('brandId') brandId: string,
    @Param('productId') productId: string,
  ) {
    return this.brandRateService.removeRate(
      req.user.tenantId,
      brandId,
      productId,
    );
  }

  @RequirePermission('rate', 'EDIT')
  @Patch(':productId/status')
  updateStatus(
    @Req() req: any,
    @Param('brandId') brandId: string,
    @Param('productId') productId: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.brandRateService.updateRateStatus(
      req.user.tenantId,
      brandId,
      productId,
      isActive,
    );
  }
}
