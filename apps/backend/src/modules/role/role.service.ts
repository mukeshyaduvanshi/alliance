import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPaginated,
  getPagination,
  type Paginated,
} from '../../common/pagination';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateRoleDto) {
    const existing = await this.prisma.role.findFirst({
      where: { tenantId, name: dto.name, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('Role with this name already exists');
    }

    return this.prisma.role.create({
      data: { tenantId, ...dto },
    });
  }

  async findAll(
    tenantId: string,
    page?: string | number,
    pageSize?: string | number,
  ): Promise<Paginated<Record<string, unknown>>> {
    const { skip, take, page: p, pageSize: size } = getPagination(page, pageSize);
    const where = { tenantId, deletedAt: null };

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.role.count({ where }),
    ]);

    return buildPaginated(roles, total, p, size);
  }

  async findOne(tenantId: string, id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        rolePermissions: { include: { permission: true } },
      },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async update(tenantId: string, id: string, dto: UpdateRoleDto) {
    await this.findOne(tenantId, id);
    return this.prisma.role.update({
      where: { id },
      data: dto,
    });
  }

  async remove(tenantId: string, id: string) {
    const role = await this.findOne(tenantId, id);
    if (role.isSystemRole) {
      throw new ForbiddenException('System roles cannot be deleted');
    }
    return this.prisma.role.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async clone(tenantId: string, id: string, newName: string) {
    const original = await this.findOne(tenantId, id);

    const cloned = await this.prisma.role.create({
      data: {
        tenantId,
        name: newName,
        description: original.description,
        department: original.department,
      },
    });

    if (original.rolePermissions.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: original.rolePermissions.map((rp) => ({
          roleId: cloned.id,
          permissionId: rp.permissionId,
        })),
      });
    }

    return cloned;
  }

  async assignPermissions(
    tenantId: string,
    id: string,
    dto: AssignPermissionsDto,
  ) {
    await this.findOne(tenantId, id);

    // Replace existing permissions with new set
    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });

    await this.prisma.rolePermission.createMany({
      data: dto.permissionIds.map((permissionId) => ({
        roleId: id,
        permissionId,
      })),
    });

    return this.findOne(tenantId, id);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: 'ACTIVE' | 'INACTIVE',
  ) {
    await this.findOne(tenantId, id);
    return this.prisma.role.update({
      where: { id },
      data: { status },
    });
  }
}

// TODO: step 4 role.controller.ts
