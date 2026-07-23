import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SelectRateDto } from './dto/select-rate.dto';

@Injectable()
export class VendorRateService {
  constructor(private prisma: PrismaService) {}

  // Vendor browses all products with the Admin's vendor-side region master
  async browseProducts(tenantId: string) {
    return this.prisma.product.findMany({
      where: { tenantId, deletedAt: null, status: 'ACTIVE' },
      include: { category: true, vendorRegionRates: true },
      orderBy: { name: 'asc' },
    });
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

  async listOwnRates(vendorId: string) {
    const rates = await this.prisma.vendorProductRate.findMany({
      where: { vendorId, isActive: true },
      include: {
        product: { include: { category: true, vendorRegionRates: true } },
      },
    });

    return rates.map((r) => ({
      ...r.product,
      region: r.region,
      rate: r.product.vendorRegionRates.find((rr) => rr.region === r.region)
        ?.rate,
    }));
  }
}
