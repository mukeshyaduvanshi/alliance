import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

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
  findAll(@Req() req: any) {
    return this.userService.findAll(req.user.tenantId);
  }
}
