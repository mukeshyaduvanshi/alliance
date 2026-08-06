import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { BrandService } from './brand.service';
import { ApprovalActionDto } from './dto/approval-action.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('brands')
export class BrandController {
  constructor(private brandService: BrandService) {}

  @RequirePermission('brand', 'VIEW')
  @Get()
  findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.brandService.findAll(
      req.user.tenantId,
      status,
      page,
      pageSize,
    );
  }

  @RequirePermission('brand', 'VIEW')
  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.brandService.findOne(req.user.tenantId, id);
  }

  @RequirePermission('brand', 'APPROVE')
  @Post(':id/approve')
  approve(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.brandService.approve(
      req.user.tenantId,
      id,
      req.user.userId,
      req.user.roleId,
      dto.remarks,
    );
  }

  @RequirePermission('brand', 'REJECT')
  @Post(':id/reject')
  reject(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.brandService.reject(
      req.user.tenantId,
      id,
      req.user.userId,
      req.user.roleId,
      dto.remarks,
    );
  }

  @RequirePermission('brand', 'EDIT')
  @Patch(':id/status')
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.brandService.updateStatus(req.user.tenantId, id, isActive);
  }
}
