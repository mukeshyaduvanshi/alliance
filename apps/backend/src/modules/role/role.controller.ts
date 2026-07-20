import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RoleService } from './role.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RoleController {
  constructor(private roleService: RoleService) {}

  @RequirePermission('role', 'CREATE')
  @Post()
  create(@Req() req: any, @Body() dto: CreateRoleDto) {
    return this.roleService.create(req.user.tenantId, dto);
  }

  @RequirePermission('role', 'VIEW')
  @Get()
  findAll(@Req() req: any) {
    return this.roleService.findAll(req.user.tenantId);
  }

  @RequirePermission('role', 'VIEW')
  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.roleService.findOne(req.user.tenantId, id);
  }

  @RequirePermission('role', 'EDIT')
  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roleService.update(req.user.tenantId, id, dto);
  }

  @RequirePermission('role', 'DELETE')
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.roleService.remove(req.user.tenantId, id);
  }

  @RequirePermission('role', 'CREATE')
  @Post(':id/clone')
  clone(@Req() req: any, @Param('id') id: string, @Body('name') name: string) {
    return this.roleService.clone(req.user.tenantId, id, name);
  }

  @RequirePermission('role', 'EDIT')
  @Patch(':id/permissions')
  assignPermissions(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.roleService.assignPermissions(req.user.tenantId, id, dto);
  }

  @RequirePermission('role', 'EDIT')
  @Patch(':id/status')
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: 'ACTIVE' | 'INACTIVE',
  ) {
    return this.roleService.updateStatus(req.user.tenantId, id, status);
  }
}
