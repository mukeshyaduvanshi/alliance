import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionService } from './permission.service';

@UseGuards(JwtAuthGuard)
@Controller('permissions')
export class PermissionController {
  constructor(private permissionService: PermissionService) {}

  @Get()
  findAll() {
    return this.permissionService.findAll();
  }
}
