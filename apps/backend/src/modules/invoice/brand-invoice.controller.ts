import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BrandJwtAuthGuard } from '../brand/guards/brand-jwt-auth.guard';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@UseGuards(BrandJwtAuthGuard)
@Controller('brand/invoices')
export class BrandInvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateInvoiceDto) {
    return this.invoiceService.create(
      req.user.tenantId,
      req.user.brandId,
      dto,
      req.user.userId,
    );
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.invoiceService.findAllForBrand(
      req.user.tenantId,
      req.user.brandId,
      page,
      pageSize,
    );
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.invoiceService.findOneForBrand(
      req.user.tenantId,
      req.user.brandId,
      id,
    );
  }
}
