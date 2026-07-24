import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { VendorJwtAuthGuard } from './guards/vendor-jwt-auth.guard';
import { VendorService } from './vendor.service';
import { VendorLoginDto } from './dto/vendor-login.dto';

@Controller('vendor-auth')
export class VendorAuthController {
  constructor(private vendorService: VendorService) {}

  @Post('login')
  login(@Body() dto: VendorLoginDto, @Req() req: any) {
    return this.vendorService.vendorLogin(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @UseGuards(VendorJwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return this.vendorService.getVendorProfile(req.user.vendorId);
  }
}
