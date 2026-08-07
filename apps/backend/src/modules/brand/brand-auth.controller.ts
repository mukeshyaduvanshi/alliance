import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BrandJwtAuthGuard } from './guards/brand-jwt-auth.guard';
import { BrandService } from './brand.service';
import { BrandLoginDto } from './dto/brand-login.dto';
import { UpdateBrandProfileDto } from './dto/update-brand-profile.dto';

@Controller('brand-auth')
export class BrandAuthController {
  constructor(private brandService: BrandService) {}

  @Post('login')
  login(@Body() dto: BrandLoginDto, @Req() req: any) {
    return this.brandService.brandLogin(dto, req.ip, req.headers['user-agent']);
  }

  @UseGuards(BrandJwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return this.brandService.getBrandProfile(req.user.brandId);
  }

  @UseGuards(BrandJwtAuthGuard)
  @Patch('me')
  updateMe(@Req() req: any, @Body() dto: UpdateBrandProfileDto) {
    return this.brandService.updateProfile(req.user.brandId, dto);
  }
}
