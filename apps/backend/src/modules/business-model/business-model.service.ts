import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SetBusinessModelDto } from './dto/set-business-model.dto';

@Injectable()
export class BusinessModelService {
  constructor(private prisma: PrismaService) {}

  async setConfig(
    tenantId: string,
    brandId: string,
    dto: SetBusinessModelDto,
    configuredById: string,
  ) {
    const brand = await this.prisma.brand.findFirst({
      where: { id: brandId, tenantId },
    });
    if (!brand) throw new NotFoundException('Brand not found');

    return this.prisma.brandBusinessModelConfig.upsert({
      where: { brandId },
      update: {
        businessModel: dto.businessModel,
        commissionPercent: dto.commissionPercent ?? null,
        markupPercent: dto.markupPercent ?? null,
        configuredById,
        effectiveFrom: new Date(),
      },
      create: {
        tenantId,
        brandId,
        businessModel: dto.businessModel,
        commissionPercent: dto.commissionPercent ?? null,
        markupPercent: dto.markupPercent ?? null,
        configuredById,
      },
    });
  }

  async getConfig(tenantId: string, brandId: string) {
    const config = await this.prisma.brandBusinessModelConfig.findFirst({
      where: { brandId, tenantId },
      include: { configuredBy: { select: { fullName: true } } },
    });
    if (!config)
      throw new NotFoundException(
        'No business model configured for this Brand yet',
      );
    return config;
  }

  async listAll(tenantId: string) {
    return this.prisma.brandBusinessModelConfig.findMany({
      where: { tenantId },
      include: { brand: { select: { brandName: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // Utility — other modules (e.g. Order pricing/reporting) can call this
  // to know how to calculate ColorJet's margin on a given order
  async calculateMargin(
    tenantId: string,
    brandId: string,
    orderAmount: number,
    vendorAmount: number,
  ) {
    const config = await this.prisma.brandBusinessModelConfig.findFirst({
      where: { brandId, tenantId },
    });

    if (!config) return { margin: orderAmount - vendorAmount, model: null };

    switch (config.businessModel) {
      case 'MEDIATOR_MODEL':
        return {
          margin: (orderAmount * Number(config.commissionPercent ?? 0)) / 100,
          model: config.businessModel,
        };
      case 'VENDOR_MODEL':
        return {
          margin: orderAmount - vendorAmount,
          model: config.businessModel,
        };
      case 'HYBRID_MODEL':
        return {
          margin:
            orderAmount -
            vendorAmount +
            (orderAmount * Number(config.commissionPercent ?? 0)) / 100,
          model: config.businessModel,
        };
      default:
        return {
          margin: orderAmount - vendorAmount,
          model: config.businessModel,
        };
    }
  }
}
