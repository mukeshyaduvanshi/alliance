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
import { VendorService } from './vendor.service';
import { VendorRateService } from './vendor-rate.service';
import { AssignVendorRateDto } from './dto/assign-vendor-rate.dto';
import { ApprovalActionDto } from './dto/approval-action.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('vendors')
export class VendorController {
  constructor(
    private vendorService: VendorService,
    private vendorRateService: VendorRateService,
  ) {}

  @RequirePermission('vendor', 'VIEW')
  @Get()
  findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.vendorService.findAll(
      req.user.tenantId,
      status,
      page,
      pageSize,
    );
  }

  @RequirePermission('vendor', 'VIEW')
  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.vendorService.findOne(req.user.tenantId, id);
  }

  @RequirePermission('vendor', 'APPROVE')
  @Post(':id/approve')
  approve(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.vendorService.approve(
      req.user.tenantId,
      id,
      req.user.userId,
      req.user.roleId,
      dto.remarks,
    );
  }

  @RequirePermission('vendor', 'REJECT')
  @Post(':id/reject')
  reject(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.vendorService.reject(
      req.user.tenantId,
      id,
      req.user.userId,
      req.user.roleId,
      dto.remarks,
    );
  }

  @RequirePermission('vendor', 'EDIT')
  @Patch(':id/status')
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.vendorService.updateStatus(req.user.tenantId, id, isActive);
  }

  @RequirePermission('vendor', 'VIEW')
  @Get(':vendorId/rates')
  listVendorRates(
    @Req() req: any,
    @Param('vendorId') vendorId: string,
  ) {
    return this.vendorRateService.listRatesForAdmin(req.user.tenantId, vendorId);
  }

  @RequirePermission('vendor', 'EDIT')
  @Post(':vendorId/rates')
  assignVendorRate(
    @Req() req: any,
    @Param('vendorId') vendorId: string,
    @Body() dto: AssignVendorRateDto,
  ) {
    return this.vendorRateService.assignRate(req.user.tenantId, vendorId, dto);
  }
}
