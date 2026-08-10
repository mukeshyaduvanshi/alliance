import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditLogService: AuditLogService,
  ) {}

  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { role: true },
    });

    if (!user || !user.passwordHash) {
      await this.auditLogService.log({
        actorType: 'INTERNAL_USER',
        action: 'FAILED_LOGIN',
        module: 'auth',
        metadata: { email, reason: 'user_not_found' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      await this.auditLogService.log({
        tenantId: user.tenantId,
        actorType: 'INTERNAL_USER',
        actorId: user.id,
        actorName: user.fullName,
        action: 'FAILED_LOGIN',
        module: 'auth',
        metadata: { email, reason: 'wrong_password' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      type: 'internal',
      tenantId: user.tenantId,
      roleId: user.roleId,
      role: user.role.name,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const tokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await this.auditLogService.log({
      tenantId: user.tenantId,
      actorType: 'INTERNAL_USER',
      actorName: user.fullName,
      action: 'LOGIN',
      module: 'auth',
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role.name,
        tenantId: user.tenantId,
        isSuperAdmin: user.isSuperAdmin,
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: {
      sub: string;
      type: string;
    };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'internal') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      include: { role: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokenPayload = {
      sub: user.id,
      type: 'internal',
      tenantId: user.tenantId,
      roleId: user.roleId,
      role: user.role.name,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
    };

    const accessToken = this.jwtService.sign(tokenPayload, {
      expiresIn: '15m',
    });
    const newRefreshToken = this.jwtService.sign(tokenPayload, {
      expiresIn: '7d',
    });

    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId: user.id },
    });
    const presentedHash = createHash('sha256').update(refreshToken).digest('hex');
    let found = false;
    for (const stored of storedTokens) {
      if (stored.tokenHash === presentedHash) {
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
        found = true;
        break;
      }
    }
    if (!found) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newTokenHash = createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role.name,
        tenantId: user.tenantId,
        isSuperAdmin: user.isSuperAdmin,
      },
    };
  }
}
