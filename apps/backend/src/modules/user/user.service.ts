import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPaginated,
  getPagination,
  type Paginated,
} from '../../common/pagination';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { tenantId, email: dto.email, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        roleId: dto.roleId,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
      },
      include: { role: true },
    });

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async findAll(
    tenantId: string,
    page?: string | number,
    pageSize?: string | number,
  ): Promise<Paginated<Record<string, unknown>>> {
    const { skip, take, page: p, pageSize: size } = getPagination(page, pageSize);
    const where = { tenantId, deletedAt: null };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { role: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);

    const safe = users.map(({ passwordHash: _, ...u }) => u);
    return buildPaginated(safe, total, p, size);
  }

  async update(tenantId: string, id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('User not found');

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.roleId !== undefined ? { roleId: dto.roleId } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: { role: true },
    });

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async resetPassword(tenantId: string, id: string, dto: ResetPasswordDto) {
    const existing = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('User not found');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { message: 'Password reset successfully' };
  }

  async me(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const permissions = (user.role?.rolePermissions ?? []).map(
      (rp) => ({
        module: rp.permission.module,
        action: rp.permission.action,
      }),
    );

    const assignedBrands = await this.prisma.brand.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { assignedKamId: userId },
          {
            managerAssignments: {
              some: { userId },
            },
          },
        ],
      },
      select: { id: true },
    });

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role?.name ?? null,
      isAdmin: user.isAdmin,
      permissions,
      assignedBrandIds: assignedBrands.map((b) => b.id),
    };
  }
}
