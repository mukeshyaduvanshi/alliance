import { Module } from '@nestjs/common';
import { BrandInvoiceController } from './brand-invoice.controller';
import { InvoiceService } from './invoice.service';

@Module({
  controllers: [BrandInvoiceController],
  providers: [InvoiceService],
})
export class InvoiceModule {}
