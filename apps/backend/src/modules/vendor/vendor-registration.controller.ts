import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { RegisterVendorDto } from './dto/register-vendor.dto';

@Controller('vendor-registration')
export class VendorRegistrationController {
  constructor(private vendorService: VendorService) {}

  @Post()
  register(@Body() dto: RegisterVendorDto) {
    const tenantId = process.env.DEFAULT_TENANT_ID as string;
    return this.vendorService.register(tenantId, dto);
  }

  @Get('status')
  checkStatus(@Query('email') email: string) {
    const tenantId = process.env.DEFAULT_TENANT_ID as string;
    return this.vendorService.checkStatus(tenantId, email);
  }
}
