import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { VendorJwtAuthGuard } from './guards/vendor-jwt-auth.guard';
import { VendorService } from './vendor.service';
import { VendorLoginDto } from './dto/vendor-login.dto';
import { RefreshTokenDto } from '../auth/dto/refresh-token.dto';

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

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.vendorService.vendorRefresh(dto.refreshToken);
  }

  @UseGuards(VendorJwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return this.vendorService.getVendorProfile(req.user.vendorId);
  }
}
