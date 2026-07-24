import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorkflowInstanceService } from '../workflow-instance/workflow-instance.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterVendorDto } from './dto/register-vendor.dto';
import * as bcrypt from 'bcrypt';
import { VendorLoginDto } from './dto/vendor-login.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class VendorService {
  constructor(
    private prisma: PrismaService,
    private workflowInstanceService: WorkflowInstanceService,
    private jwtService: JwtService,
    private auditLogService: AuditLogService,
  ) {}

  async register(tenantId: string, dto: RegisterVendorDto) {
    const existingPan = await this.prisma.businessProfile.findUnique({
      where: { panNumber: dto.panNumber },
    });

    if (existingPan)
      throw new ConflictException(
        'A business is already registered with this PAN',
      );

    const existingEmail = await this.prisma.vendor.findFirst({
      where: { tenantId, email: dto.email, deletedAt: null },
    });
    if (existingEmail)
      throw new ConflictException('A vendor with this email already exists');

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
        cinDocUrl: dto.cinDocUrl,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
      },
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const vendor = await this.prisma.vendor.create({
      data: {
        tenantId,
        businessProfileId: businessProfile.id,
        vendorName: dto.vendorName,
        contactPersonName: dto.contactPersonName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        approvalStatus: 'PENDING',
      },
    });

    const instance = await this.workflowInstanceService.start(
      tenantId,
      {
        module: 'vendor_onboarding',
        entityType: 'Vendor',
        entityId: vendor.id,
      },
      undefined,
    );

    await this.prisma.vendor.update({
      where: { id: vendor.id },
      data: { workflowInstanceId: instance.id },
    });

    return {
      message: 'Registration submitted, pending approval',
      vendorId: vendor.id,
    };
  }

  async checkStatus(tenantId: string, email: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { tenantId, email, deletedAt: null },
      select: { approvalStatus: true, createdAt: true },
    });
    if (!vendor)
      throw new NotFoundException('No application found for this email');
    return vendor;
  }

  async findAll(tenantId: string, status?: string) {
    return this.prisma.vendor.findMany({
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
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { businessProfile: true },
    });

    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async approve(
    tenantId: string,
    vendorId: string,
    userId: string,
    roleId: string,
    remarks?: string,
  ) {
    const vendor = await this.findOne(tenantId, vendorId);
    if (!vendor.workflowInstanceId)
      throw new NotFoundException('No workflow instance linked');

    await this.workflowInstanceService.approve(
      tenantId,
      vendor.workflowInstanceId,
      userId,
      roleId,
      remarks,
    );
    const instance = await this.workflowInstanceService.findOne(
      tenantId,
      vendor.workflowInstanceId,
    );

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        approvalStatus: instance.status === 'APPROVED' ? 'APPROVED' : 'PENDING',
      },
    });
  }

  async reject(
    tenantId: string,
    vendorId: string,
    userId: string,
    roleId: string,
    remarks?: string,
  ) {
    const vendor = await this.findOne(tenantId, vendorId);
    if (!vendor.workflowInstanceId)
      throw new NotFoundException('No workflow instance linked');

    await this.workflowInstanceService.reject(
      tenantId,
      vendor.workflowInstanceId,
      userId,
      roleId,
      remarks,
    );

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: { approvalStatus: 'REJECTED' },
    });
  }

  async updateStatus(tenantId: string, vendorId: string, isActive: boolean) {
    await this.findOne(tenantId, vendorId);
    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: { isActive },
    });
  }

  async vendorLogin(
    dto: VendorLoginDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    if (!vendor || !vendor.passwordHash) {
      await this.auditLogService.log({
        actorType: 'VENDOR',
        action: 'FAILED_LOGIN',
        module: 'vendor_auth',
        metadata: { email: dto.email, reason: 'user_not_found' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }
    if (vendor.approvalStatus !== 'APPROVED') {
      throw new ForbiddenException('Your account is pending approval');
    }

    if (!vendor.isActive) {
      throw new ForbiddenException('Your account has been deactivated');
    }

    const isValid = await bcrypt.compare(dto.password, vendor.passwordHash);
    if (!isValid) {
      await this.auditLogService.log({
        tenantId: vendor.tenantId,
        actorType: 'VENDOR',
        actorId: vendor.id,
        actorName: vendor.vendorName,
        action: 'FAILED_LOGIN',
        module: 'vendor_auth',
        metadata: { email: dto.email, reason: 'wrong_password' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: vendor.id,
      vendorId: vendor.id,
      tenantId: vendor.tenantId,
      type: 'vendor',
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.auditLogService.log({
      tenantId: vendor.tenantId,
      actorType: 'VENDOR',
      actorId: vendor.id,
      actorName: vendor.vendorName,
      action: 'LOGIN',
      module: 'vendor_auth',
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      vendor: {
        id: vendor.id,
        vendorName: vendor.vendorName,
        email: vendor.email,
      },
    };
  }

  async getVendorProfile(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return this.findOne(vendor.tenantId, vendorId);
  }
}
