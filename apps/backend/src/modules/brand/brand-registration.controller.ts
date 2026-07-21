import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BrandService } from './brand.service';
import { RegisterBrandDto } from './dto/register-brand.dto';

@Controller('brand-registration')
export class BrandRegistrationController {
  constructor(private brandService: BrandService) {}

  @Post()
  register(@Body() dto: RegisterBrandDto) {
    // TODO: tenantId will come from subdomain resolution later; hardcoded/default tenant for now
    const tenantId = process.env.DEFAULT_TENANT_ID as string;
    return this.brandService.register(tenantId, dto);
  }

  @Get('status')
  checkStatus(@Query('email') email: string) {
    const tenantId = process.env.DEFAULT_TENANT_ID as string;
    return this.brandService.checkStatus(tenantId, email);
  }
}
