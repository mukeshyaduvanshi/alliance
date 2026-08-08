import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @RequirePermission('user', 'CREATE')
  @Post()
  create(@Req() req: any, @Body() dto: CreateUserDto) {
    return this.userService.create(req.user.tenantId, dto);
  }

  @RequirePermission('user', 'VIEW')
  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.userService.findAll(req.user.tenantId, page, pageSize);
  }

  @Get('me')
  me(@Req() req: any) {
    return this.userService.me(req.user.tenantId, req.user.userId);
  }

  @RequirePermission('user', 'EDIT')
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(req.user.tenantId, id, dto);
  }

  @RequirePermission('user', 'EDIT')
  @Post(':id/reset-password')
  resetPassword(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.userService.resetPassword(req.user.tenantId, id, dto);
  }
}
