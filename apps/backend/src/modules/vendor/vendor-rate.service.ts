import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@database/database';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPaginated,
  getPagination,
  type Paginated,
} from '../../common/pagination';
import { SelectRateDto } from './dto/select-rate.dto';
import { AssignVendorRateDto } from './dto/assign-vendor-rate.dto';

@Injectable()
export class VendorRateService {
  constructor(private prisma: PrismaService) {}

  // Vendor browses all products with the Admin's vendor-side region master
  async browseProducts(
    tenantId: string,
    page?: string | number,
    pageSize?: string | number,
  ) {
    const { skip, take, page: p, pageSize: size } = getPagination(page, pageSize);
    const where = { tenantId, deletedAt: null, status: ProductStatus.ACTIVE };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true, vendorRegionRates: true },
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      this.prisma.product.count({ where }),
    ]);

    return buildPaginated(products, total, p, size);
  }

  // Vendor selects a region for a product — this IS there rate
  async selectRate(tenantId: string, vendorId: string, dto: SelectRateDto) {
    const regionRate = await this.prisma.vendorRegionRate.findUnique({
      where: {
        productId_region: { productId: dto.productId, region: dto.region },
      },
    });
    if (!regionRate)
      throw new NotFoundException('No rate configured for this product/region');

    return this.prisma.vendorProductRate.upsert({
      where: { vendorId_productId: { vendorId, productId: dto.productId } },
      update: { region: dto.region, isActive: true },
      create: {
        tenantId,
        vendorId,
        productId: dto.productId,
        region: dto.region,
      },
    });
  }

  async listOwnRates(
    vendorId: string,
    page?: string | number,
    pageSize?: string | number,
  ) {    const { skip, take, page: p, pageSize: size } = getPagination(page, pageSize);
    const where = { vendorId, isActive: true };

    const [rates, total] = await Promise.all([
      this.prisma.vendorProductRate.findMany({
        where,
        include: {
          product: { include: { category: true, vendorRegionRates: true } },
        },
        skip,
        take,
      }),
      this.prisma.vendorProductRate.count({ where }),
    ]);

    const data = rates.map((r) => ({
      ...r.product,
      region: r.region,
      rate: r.product.vendorRegionRates.find((rr) => rr.region === r.region)
        ?.rate,
    }));

    return buildPaginated(data, total, p, size);
  }

  // ===== Admin assigns a payout rate to a vendor (product × region) =====

  async assignRate(
    tenantId: string,
    vendorId: string,
    dto: AssignVendorRateDto,
  ) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, tenantId, deletedAt: null },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    await this.prisma.vendorRegionRate.upsert({
      where: {
        productId_region: { productId: dto.productId, region: dto.region },
      },
      update: { rate: dto.rate },
      create: {
        productId: dto.productId,
        region: dto.region,
        rate: dto.rate,
      },
    });

    return this.prisma.vendorProductRate.upsert({
      where: { vendorId_productId: { vendorId, productId: dto.productId } },
      update: { region: dto.region, isActive: true },
      create: {
        tenantId,
        vendorId,
        productId: dto.productId,
        region: dto.region,
      },
    });
  }

  async listRatesForAdmin(tenantId: string, vendorId: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, tenantId, deletedAt: null },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const rates = await this.prisma.vendorProductRate.findMany({
      where: { vendorId, isActive: true },
      include: {
        product: { include: { category: true, vendorRegionRates: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return rates.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.product.name,
      category: r.product.category?.name ?? null,
      region: r.region,
      rate: r.product.vendorRegionRates.find((rr) => rr.region === r.region)
        ?.rate ?? null,
      updatedAt: r.updatedAt,
    }));
  }
}
