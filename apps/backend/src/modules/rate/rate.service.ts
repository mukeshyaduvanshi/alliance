import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPaginated,
  getPagination,
  type Paginated,
} from '../../common/pagination';
import { CreateRateDto } from './dto/create-rate.dto';
import { UpdateRateDto } from './dto/update-rate.dto';
import { SetOwnRateDto } from './dto/set-own-rate.dto';

@Injectable()
export class RateService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateRateDto) {
    const existing = await this.prisma.rate.findFirst({
      where: { tenantId, label: dto.label, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('A rate with this label already exists');
    }

    const { regionRates, ...rateData } = dto;
    return this.prisma.$transaction(async (tx) => {
      const rate = await tx.rate.create({
        data: {
          tenantId,
          ...rateData,
          regions: {
            create: regionRates.map((r) => ({
              region: r.region,
              rate: r.rate,
            })),
          },
        },
      });
      return this.buildDetail(tx, rate.id);
    });
  }

  async findAll(
    tenantId: string,
    page?: string | number,
    pageSize?: string | number,
  ): Promise<Paginated<Record<string, unknown>>> {
    const {
      skip,
      take,
      page: p,
      pageSize: size,
    } = getPagination(page, pageSize);
    const where = { tenantId, deletedAt: null };

    const [rates, total] = await Promise.all([
      this.prisma.rate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.rate.count({ where }),
    ]);

    const data = await Promise.all(
      rates.map((r) => this.buildDetail(this.prisma, r.id)),
    );

    return buildPaginated(data, total, p, size);
  }

  async findOne(tenantId: string, id: string) {
    const rate = await this.prisma.rate.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!rate) throw new NotFoundException('Rate not found');
    return this.buildDetail(this.prisma, id);
  }

  async update(tenantId: string, id: string, dto: UpdateRateDto) {
    await this.findOne(tenantId, id);
    const { regionRates, ...rateData } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (regionRates && regionRates.length > 0) {
        await tx.rateRegionRate.deleteMany({ where: { rateId: id } });
        await tx.rateRegionRate.createMany({
          data: regionRates.map((r) => ({
            rateId: id,
            region: r.region,
            rate: r.rate,
          })),
        });
      }
      await tx.rate.update({ where: { id }, data: rateData });
      return this.buildDetail(tx, id);
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.rate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ===== Brand own rates =====

  async setBrandRate(
    tenantId: string,
    brandId: string,
    rateId: string,
    dto: SetOwnRateDto,
  ) {
    const rate = await this.prisma.rate.findFirst({
      where: { id: rateId, tenantId, deletedAt: null },
    });
    if (!rate) throw new NotFoundException('Rate not found');

    const brand = await this.prisma.brand.findFirst({
      where: { id: brandId, tenantId, deletedAt: null },
    });
    if (!brand) throw new NotFoundException('Brand not found');

    return this.prisma.brandRate.upsert({
      where: {
        brandId_rateId_region: {
          brandId,
          rateId,
          region: dto.region,
        },
      },
      update: { rate: dto.rate, isActive: true },
      create: {
        tenantId,
        brandId,
        rateId,
        region: dto.region,
        rate: dto.rate,
      },
    });
  }

  async deleteBrandRate(tenantId: string, brandId: string, rateId: string) {
    return this.prisma.brandRate.deleteMany({
      where: { tenantId, brandId, rateId },
    });
  }

  async listRatesForBrand(tenantId: string, brandId: string) {
    const rates = await this.prisma.rate.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        regions: true,
        brandRates: {
          where: { brandId, isActive: true },
          include: { brand: { select: { id: true, brandName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rates.map((r) => {
      const own = r.brandRates.map((br) => ({
        rateId: br.rateId,
        region: br.region,
        rate: br.rate.toFixed(2),
        brandId: br.brandId,
        brandName: br.brand.brandName,
      }));
      const { brandRates: brandRatesUnused, regions: _adminRegions, ...rest } = r;
      void brandRatesUnused;
      void _adminRegions;
      return {
        ...rest,
        calcWidth: r.calcWidth != null ? String(Number(r.calcWidth)) : null,
        calcHeight: r.calcHeight != null ? String(Number(r.calcHeight)) : null,
        measWidth: r.measWidth != null ? String(Number(r.measWidth)) : null,
        measHeight: r.measHeight != null ? String(Number(r.measHeight)) : null,
        brandRates: own,
      };
    });
  }

  // ===== Vendor own rates =====

  async setVendorRate(
    tenantId: string,
    vendorId: string,
    rateId: string,
    dto: SetOwnRateDto,
  ) {
    const rate = await this.prisma.rate.findFirst({
      where: { id: rateId, tenantId, deletedAt: null },
    });
    if (!rate) throw new NotFoundException('Rate not found');

    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, tenantId, deletedAt: null },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    return this.prisma.vendorRate.upsert({
      where: {
        vendorId_rateId_region: {
          vendorId,
          rateId,
          region: dto.region,
        },
      },
      update: { rate: dto.rate, isActive: true },
      create: {
        tenantId,
        vendorId,
        rateId,
        region: dto.region,
        rate: dto.rate,
      },
    });
  }

  async listRatesForVendor(tenantId: string, vendorId: string) {
    const rates = await this.prisma.rate.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        regions: true,
        vendorRates: {
          where: { vendorId, isActive: true },
          include: { vendor: { select: { id: true, vendorName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rates.map((r) => {
      const own = r.vendorRates.map((vr) => ({
        rateId: vr.rateId,
        region: vr.region,
        rate: vr.rate.toFixed(2),
        vendorId: vr.vendorId,
        vendorName: vr.vendor.vendorName,
      }));
      const { vendorRates: vendorRatesUnused, regions: _adminRegions, ...rest } = r;
      void vendorRatesUnused;
      void _adminRegions;
      return {
        ...rest,
        calcWidth: r.calcWidth != null ? String(Number(r.calcWidth)) : null,
        calcHeight: r.calcHeight != null ? String(Number(r.calcHeight)) : null,
        measWidth: r.measWidth != null ? String(Number(r.measWidth)) : null,
        measHeight: r.measHeight != null ? String(Number(r.measHeight)) : null,
        vendorRates: own,
      };
    });
  }

  // ===== shared helpers =====

  private async buildDetail(tx: any, rateId: string) {
    const rate = await tx.rate.findFirst({
      where: { id: rateId, deletedAt: null },
      include: {
        regions: true,
        brandRates: {
          where: { isActive: true },
          include: { brand: { select: { id: true, brandName: true } } },
          orderBy: { updatedAt: 'asc' },
        },
        vendorRates: {
          where: { isActive: true },
          include: { vendor: { select: { id: true, vendorName: true } } },
          orderBy: { updatedAt: 'asc' },
        },
      },
    });
    if (!rate) throw new NotFoundException('Rate not found');

    const { regions, brandRates, vendorRates, ...rest } = rate;
    return {
      ...rest,
      calcWidth: rest.calcWidth != null ? String(Number(rest.calcWidth)) : null,
      calcHeight: rest.calcHeight != null ? String(Number(rest.calcHeight)) : null,
      measWidth: rest.measWidth != null ? String(Number(rest.measWidth)) : null,
      measHeight: rest.measHeight != null ? String(Number(rest.measHeight)) : null,
      regions: regions.map((r) => ({
        id: r.id,
        region: r.region,
        rate: r.rate.toFixed(2),
      })),
      brandQuotes: brandRates.map((br) => ({
        brandId: br.brandId,
        brandName: br.brand.brandName,
        region: br.region,
        rate: br.rate.toFixed(2),
      })),
      vendorQuotes: vendorRates.map((vr) => ({
        vendorId: vr.vendorId,
        vendorName: vr.vendor.vendorName,
        region: vr.region,
        rate: vr.rate.toFixed(2),
      })),
    };
  }
}
