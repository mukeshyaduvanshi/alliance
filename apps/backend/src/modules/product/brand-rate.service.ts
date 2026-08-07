import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@database/database';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPaginated,
  getPagination,
  type Paginated,
} from '../../common/pagination';
import { AssignRateDto } from './dto/assign-rate.dto';

@Injectable()
export class BrandRateService {
  constructor(private prisma: PrismaService) {}

  async assignRate(
    tenantId: string,
    brandId: string,
    dto: AssignRateDto,
    assignedById: string,
  ) {
    return this.prisma.brandProductRate.upsert({
      where: { brandId_productId: { brandId, productId: dto.productId } },
      update: {
        region: dto.region,
        isCustomRate: dto.isCustomRate ?? false,
        customRate: dto.isCustomRate ? dto.customRate : null,
        isActive: true,
        assignedById,
      },
      create: {
        tenantId,
        brandId,
        productId: dto.productId,
        region: dto.region,
        isCustomRate: dto.isCustomRate ?? false,
        customRate: dto.isCustomRate ? dto.customRate : null,
        assignedById,
      },
    });
  }

  async listForBrandAdmin(tenantId: string, brandId: string) {
    const rates = await this.prisma.brandProductRate.findMany({
      where: { tenantId, brandId },
      include: { product: { include: { category: true, regionRates: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return rates.map((r) => ({
      ...r,
      effectiveRate: r.isCustomRate
        ? r.customRate
        : r.product.regionRates.find((rr) => rr.region === r.region)?.rate,
    }));
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

  async findProductsForBrand(
    brandId: string,
    page?: string | number,
    pageSize?: string | number,
  ): Promise<Paginated<Record<string, unknown>>> {
    const { skip, take, page: p, pageSize: size } = getPagination(page, pageSize);
    const where = {
      brandId,
      isActive: true,
      product: { deletedAt: null, status: ProductStatus.ACTIVE },
    };

    const [rates, total] = await Promise.all([
      this.prisma.brandProductRate.findMany({
        where,
        include: { product: { include: { category: true, regionRates: true } } },
        skip,
        take,
      }),
      this.prisma.brandProductRate.count({ where }),
    ]);

    const data = rates.map((r) => {
      const effectiveRate = r.isCustomRate
        ? r.customRate
        : r.product.regionRates.find((rr) => rr.region === r.region)?.rate;

      return {
        ...r.product,
        region: r.region,
        isCustomRate: r.isCustomRate,
        rate: effectiveRate,
      };
    });

    return buildPaginated(data, total, p, size);
  }

  async findOneForBrand(brandId: string, productId: string) {
    const rate = await this.prisma.brandProductRate.findFirst({
      where: { brandId, productId, isActive: true },
      include: { product: { include: { category: true, regionRates: true } } },
    });
    if (!rate)
      throw new NotFoundException('Product not available for your account');

    const effectiveRate = rate.isCustomRate
      ? rate.customRate
      : rate.product.regionRates.find((rr) => rr.region === rate.region)?.rate;

    return {
      ...rate.product,
      region: rate.region,
      isCustomRate: rate.isCustomRate,
      rate: effectiveRate,
    };
  }
}
