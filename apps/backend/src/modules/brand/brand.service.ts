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
import {
  buildPaginated,
  getPagination,
  type Paginated,
} from '../../common/pagination';
import { WorkflowInstanceService } from '../workflow-instance/workflow-instance.service';
import { RegisterBrandDto } from './dto/register-brand.dto';
import { BrandLoginDto } from './dto/brand-login.dto';
import { UpdateBrandProfileDto } from './dto/update-brand-profile.dto';
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
    const existingEmail = await this.prisma.brand.findFirst({
      where: { tenantId, email: dto.email, deletedAt: null },
    });
    if (existingEmail) {
      throw new ConflictException('A brand with this email already exists');
    }

    // Empty optional strings ko null normalize (unique constraint collision se bachne ke liye)
    const panNumber = dto.panNumber?.trim() || null;
    const gstNumber = dto.gstNumber?.trim() || null;
    const msmeNumber = dto.msmeNumber?.trim() || null;
    const cinNumber = dto.cinNumber?.trim() || null;

    // Agar PAN diya hai to existing profile dhundo:
    // - active brand linked hai → conflict
    // - orphan/deleted brand → profile reuse (update) karo
    let businessProfile: { id: string };
    const existingProfile = panNumber
      ? await this.prisma.businessProfile.findUnique({
          where: { panNumber },
          include: {
            brand: { include: { tenant: true } },
            vendors: { select: { id: true } },
          },
        })
      : null;

    if (existingProfile) {
      const activeBrand = existingProfile.brand?.deletedAt === null;
      if (activeBrand) {
        throw new ConflictException(
          'A business is already registered with this PAN',
        );
      }
      businessProfile = await this.prisma.businessProfile.update({
        where: { id: existingProfile.id },
        data: {
          legalName: dto.legalName,
          businessType: dto.businessType,
          gstNumber,
          msmeNumber,
          cinNumber,
          panDocUrl: dto.panDocUrl ?? null,
          gstDocUrl: dto.gstDocUrl ?? null,
          msmeDocUrl: dto.msmeDocUrl ?? null,
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2 ?? null,
          city: dto.city,
          state: dto.state,
          pincode: dto.pincode,
        },
      });
    } else {
      businessProfile = await this.prisma.businessProfile.create({
        data: {
          legalName: dto.legalName,
          businessType: dto.businessType,
          panNumber,
          gstNumber,
          msmeNumber,
          cinNumber,
          panDocUrl: dto.panDocUrl ?? null,
          gstDocUrl: dto.gstDocUrl ?? null,
          msmeDocUrl: dto.msmeDocUrl ?? null,
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2 ?? null,
          city: dto.city,
          state: dto.state,
          pincode: dto.pincode,
        },
      });
    }

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

  async findAll(
    tenantId: string,
    status?: string,
    page?: string | number,
    pageSize?: string | number,
  ): Promise<Paginated<Record<string, unknown>>> {
    const {
      skip,
      take,
      page: p,
      pageSize: size,
    } = getPagination(page, pageSize);
    const where = {
      tenantId,
      deletedAt: null,
      ...(status ? { approvalStatus: status as any } : {}),
    };

    const [brands, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        include: { businessProfile: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.brand.count({ where }),
    ]);

    const safe = brands.map(({ passwordHash: _, ...b }) => b);
    return buildPaginated(safe, total, p, size);
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
      role: 'BRAND',
      email: brand.email,
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
      brand: {
        id: brand.id,
        brandName: brand.brandName,
        email: brand.email,
        tenantId: brand.tenantId,
      },
      user: {
        id: brand.id,
        fullName: brand.brandName,
        email: brand.email,
        roleId: null,
        roleName: 'BRAND',
        tenantId: brand.tenantId,
        isSuperAdmin: false,
        brandId: brand.id,
      },
    };
  }

  async getBrandProfile(brandId: string) {
    return this.findOne(
      (await this.prisma.brand.findUnique({ where: { id: brandId } }))!
        .tenantId,
      brandId,
    );
  }

  async updateProfile(brandId: string, dto: UpdateBrandProfileDto) {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
    });
    if (!brand) throw new NotFoundException('Brand not found');

    const { brandName, contactPersonName, phone, businessProfile } = dto;

    const updatedBrand = await this.prisma.brand.update({
      where: { id: brandId },
      data: {
        ...(brandName !== undefined ? { brandName } : {}),
        ...(contactPersonName !== undefined ? { contactPersonName } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(businessProfile
          ? {
              businessProfile: {
                update: {
                  ...(businessProfile.legalName !== undefined
                    ? { legalName: businessProfile.legalName }
                    : {}),
                  ...(businessProfile.addressLine1 !== undefined
                    ? { addressLine1: businessProfile.addressLine1 }
                    : {}),
                  ...(businessProfile.addressLine2 !== undefined
                    ? { addressLine2: businessProfile.addressLine2 }
                    : {}),
                  ...(businessProfile.city !== undefined
                    ? { city: businessProfile.city }
                    : {}),
                  ...(businessProfile.state !== undefined
                    ? { state: businessProfile.state }
                    : {}),
                  ...(businessProfile.pincode !== undefined
                    ? { pincode: businessProfile.pincode }
                    : {}),
                },
              },
            }
          : {}),
      },
      include: { businessProfile: true },
    });

    const { passwordHash: _, ...safeBrand } = updatedBrand;
    return safeBrand;
  }
}
