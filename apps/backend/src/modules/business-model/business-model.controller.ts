import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { BusinessModelService } from './business-model.service';
import { SetBusinessModelDto } from './dto/set-business-model.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('brands/:brandId/business-model')
export class BusinessModelController {
  constructor(private businessModelService: BusinessModelService) {}

  @RequirePermission('business_model', 'EDIT')
  @Post()
  setConfig(
    @Req() req: any,
    @Param('brandId') brandId: string,
    @Body() dto: SetBusinessModelDto,
  ) {
    return this.businessModelService.setConfig(
      req.user.tenantId,
      brandId,
      dto,
      req.user.userId,
    );
  }

  @RequirePermission('business_model', 'VIEW')
  @Get()
  getConfig(@Req() req: any, @Param('brandId') brandId: string) {
    return this.businessModelService.getConfig(req.user.tenantId, brandId);
  }
}
