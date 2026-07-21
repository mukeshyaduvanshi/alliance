import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { BrandJwtAuthGuard } from './guards/brand-jwt-auth.guard';
import { BrandService } from './brand.service';
import { BrandLoginDto } from './dto/brand-login.dto';

@Controller('brand-auth')
export class BrandAuthController {
  constructor(private brandService: BrandService) {}

  @Post('login')
  login(@Body() dto: BrandLoginDto) {
    return this.brandService.brandLogin(dto);
  }

  @UseGuards(BrandJwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return this.brandService.getBrandProfile(req.user.brandId);
  }
}
