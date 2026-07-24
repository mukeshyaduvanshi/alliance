import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkflowInstanceService } from '../workflow-instance/workflow-instance.service';
import { RegisterBrandDto } from './dto/register-brand.dto';
import { BrandLoginDto } from './dto/brand-login.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class BrandService {
  constructor(
    private prisma: PrismaService,
    private workflowInstanceService: WorkflowInstanceService,
    private jwtService: JwtService,
    private auditLogService: AuditLogService,
    private notificationService: NotificationService,
  ) {}

  async register(tenantId: string, dto: RegisterBrandDto) {
    const existingPan = await this.prisma.businessProfile.findUnique({
      where: { panNumber: dto.panNumber },
    });
    if (existingPan) {
      throw new ConflictException(
        'A business is already registered with this PAN',
      );
    }

    const existingEmail = await this.prisma.brand.findFirst({
      where: { tenantId, email: dto.email, deletedAt: null },
    });
    if (existingEmail) {
      throw new ConflictException('A brand with this email already exists');
    }

    const businessProfile = await this.prisma.businessProfile.create({
      data: {
        legalName: dto.legalName,
        businessType: dto.businessType,
        panNumber: dto.panNumber,
        gstNumber: dto.gstNumber,
        msmeNumber: dto.msmeNumber,
        cinNumber: dto.cinNumber,
        panDocUrl: dto.panDocUrl,
        gstDocUrl: dto.gstDocUrl,
        msmeDocUrl: dto.msmeDocUrl,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
      },
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const brand = await this.prisma.brand.create({
      data: {
        tenantId,
        businessProfileId: businessProfile.id,
        brandName: dto.brandName,
        contactPersonName: dto.contactPersonName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        approvalStatus: 'PENDING',
      },
    });

    const instance = await this.workflowInstanceService.start(
      tenantId,
      { module: 'brand_onboarding', entityType: 'Brand', entityId: brand.id },
      undefined,
    );

    await this.prisma.brand.update({
      where: { id: brand.id },
      data: { workflowInstanceId: instance.id },
    });

    return {
      message: 'Registration submitted, pending approval',
      brandId: brand.id,
    };
  }

  async checkStatus(tenantId: string, email: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { tenantId, email, deletedAt: null },
      select: { approvalStatus: true, createdAt: true },
    });
    if (!brand)
      throw new NotFoundException('No application found for this email');
    return brand;
  }

  async findAll(tenantId: string, status?: string) {
    return this.prisma.brand.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(status ? { approvalStatus: status as any } : {}),
      },
      include: { businessProfile: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { businessProfile: true },
    });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  async approve(
    tenantId: string,
    brandId: string,
    userId: string,
    roleId: string,
    remarks?: string,
  ) {
    const brand = await this.findOne(tenantId, brandId);
    if (!brand.workflowInstanceId)
      throw new NotFoundException('No workflow instance linked to this brand');

    await this.workflowInstanceService.approve(
      tenantId,
      brand.workflowInstanceId,
      userId,
      roleId,
      remarks,
    );
    const instance = await this.workflowInstanceService.findOne(
      tenantId,
      brand.workflowInstanceId,
    );

    if (instance.status === 'APPROVED') {
      await this.notificationService.notify({
        tenantId,
        recipientType: 'BRAND',
        recipientId: brandId,
        title: 'Registration Approved',
        message: 'Your ColorJet account has been approved. You can now log in.',
        email: {
          to: brand.email,
          subject: 'Welcome to ColorJet — Account Approved',
          html: `<p>Hi ${brand.contactPersonName},</p><p>Your account has been approved. You can now log in and start placing orders.</p>`,
        },
      });
    }

    return this.prisma.brand.update({
      where: { id: brandId },
      data: {
        approvalStatus: instance.status === 'APPROVED' ? 'APPROVED' : 'PENDING',
      },
    });
  }

  async reject(
    tenantId: string,
    brandId: string,
    userId: string,
    roleId: string,
    remarks?: string,
  ) {
    const brand = await this.findOne(tenantId, brandId);
    if (!brand.workflowInstanceId)
      throw new NotFoundException('No workflow instance linked to this brand');

    await this.workflowInstanceService.reject(
      tenantId,
      brand.workflowInstanceId,
      userId,
      roleId,
      remarks,
    );

    return this.prisma.brand.update({
      where: { id: brandId },
      data: { approvalStatus: 'REJECTED' },
    });
  }

  async updateStatus(tenantId: string, brandId: string, isActive: boolean) {
    await this.findOne(tenantId, brandId);
    return this.prisma.brand.update({
      where: { id: brandId },
      data: { isActive },
    });
  }

  // ===== Brand's own login =====

  async brandLogin(dto: BrandLoginDto, ipAddress?: string, userAgent?: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    if (!brand || !brand.passwordHash) {
      await this.auditLogService.log({
        actorType: 'BRAND',
        action: 'FAILED_LOGIN',
        module: 'brand_auth',
        metadata: { email: dto.email, reason: 'user_not_found' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (brand.approvalStatus !== 'APPROVED') {
      throw new ForbiddenException('Your account is pending approval');
    }

    if (!brand.isActive) {
      throw new ForbiddenException('Your account has been deactivated');
    }

    const isValid = await bcrypt.compare(dto.password, brand.passwordHash);
    if (!isValid) {
      await this.auditLogService.log({
        tenantId: brand.tenantId,
        actorType: 'BRAND',
        actorId: brand.id,
        actorName: brand.brandName,
        action: 'FAILED_LOGIN',
        module: 'brand_auth',
        metadata: { email: dto.email, reason: 'wrong_password' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: brand.id,
      brandId: brand.id,
      tenantId: brand.tenantId,
      type: 'brand',
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.auditLogService.log({
      tenantId: brand.tenantId,
      actorType: 'BRAND',
      actorId: brand.id,
      actorName: brand.brandName,
      action: 'LOGIN',
      module: 'brand_auth',
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      brand: { id: brand.id, brandName: brand.brandName, email: brand.email },
    };
  }

  async getBrandProfile(brandId: string) {
    return this.findOne(
      (await this.prisma.brand.findUnique({ where: { id: brandId } }))!
        .tenantId,
      brandId,
    );
  }
}
