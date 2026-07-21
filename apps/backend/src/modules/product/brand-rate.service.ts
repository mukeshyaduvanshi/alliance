import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AssignRateDto } from './dto/assign-rate.dto';

@Injectable()
export class BrandRateService {
  constructor(private prisma: PrismaService) {}

  // ===== Admin side =====

  async assignRate(
    tenantId: string,
    brandId: string,
    dto: AssignRateDto,
    assignedById: string,
  ) {
    return this.prisma.brandProductRate.upsert({
      where: { brandId_productId: { brandId, productId: dto.productId } },
      update: { rate: dto.rate, isActive: true, assignedById },
      create: {
        tenantId,
        brandId,
        productId: dto.productId,
        rate: dto.rate,
        assignedById,
      },
    });
  }

  async listForBrandAdmin(tenantId: string, brandId: string) {
    return this.prisma.brandProductRate.findMany({
      where: { tenantId, brandId },
      include: { product: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeRate(tenantId: string, brandId: string, productId: string) {
    const rate = await this.prisma.brandProductRate.findFirst({
      where: { tenantId, brandId, productId },
    });
    if (!rate) throw new NotFoundException('Rate not found');
    return this.prisma.brandProductRate.delete({ where: { id: rate.id } });
  }

  async updateRateStatus(
    tenantId: string,
    brandId: string,
    productId: string,
    isActive: boolean,
  ) {
    const rate = await this.prisma.brandProductRate.findFirst({
      where: { tenantId, brandId, productId },
    });
    if (!rate) throw new NotFoundException('Rate not found');
    return this.prisma.brandProductRate.update({
      where: { id: rate.id },
      data: { isActive },
    });
  }

  // ===== Brand side =====

  async findProductsForBrand(brandId: string) {
    const rates = await this.prisma.brandProductRate.findMany({
      where: {
        brandId,
        isActive: true,
        product: { deletedAt: null, status: 'ACTIVE' },
      },
      include: { product: { include: { category: true } } },
    });

    return rates.map((r) => ({
      ...r.product,
      rate: r.rate,
    }));
  }

  async findOneForBrand(brandId: string, productId: string) {
    const rate = await this.prisma.brandProductRate.findFirst({
      where: { brandId, productId, isActive: true },
      include: { product: { include: { category: true } } },
    });
    if (!rate)
      throw new NotFoundException('Product not available for your account');
    return { ...rate.product, rate: rate.rate };
  }
}
