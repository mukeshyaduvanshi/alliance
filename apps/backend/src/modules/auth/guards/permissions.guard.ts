import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma.service';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<{ module: string; action: string }>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    if (!required) return true; // no permission required on this route

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user.isSuperAdmin) return true; // bypass for Super Admin

    const rolePermission = await this.prisma.rolePermission.findFirst({
      where: {
        roleId: user.roleId,
        permission: {
          module: required.module,
          action: required.action as any,
        },
      },
    });

    if (!rolePermission) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
