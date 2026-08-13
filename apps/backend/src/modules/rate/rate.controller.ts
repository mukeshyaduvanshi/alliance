import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { RateService } from './rate.service';
import { CreateRateDto } from './dto/create-rate.dto';
import { UpdateRateDto } from './dto/update-rate.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('rates')
export class RateController {
  constructor(private rateService: RateService) {}

  @RequirePermission('product', 'VIEW')
  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.rateService.findAll(req.user.tenantId, page, pageSize);
  }

  @RequirePermission('product', 'VIEW')
  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.rateService.findOne(req.user.tenantId, id);
  }

  @RequirePermission('product', 'CREATE')
  @Post()
  create(@Req() req: any, @Body() dto: CreateRateDto) {
    return this.rateService.create(req.user.tenantId, dto);
  }

  @RequirePermission('product', 'EDIT')
  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateRateDto) {
    return this.rateService.update(req.user.tenantId, id, dto);
  }

  @RequirePermission('product', 'DELETE')
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.rateService.remove(req.user.tenantId, id);
  }
}
