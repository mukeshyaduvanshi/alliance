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
import { CreateProductDto, RegionRateInput } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  // ===== Products (Admin catalog) =====

  async create(tenantId: string, dto: CreateProductDto) {
    if (dto.sku) {
      const existing = await this.prisma.product.findFirst({
        where: { tenantId, sku: dto.sku, deletedAt: null },
      });
      if (existing) throw new ConflictException('SKU already exists');
    }

    const product = await this.prisma.product.create({
      data: {
        tenantId,
        name: dto.name,
        sku: dto.sku,
        description: dto.description,
        unit: dto.unit,
        categoryId: dto.categoryId,
        imageUrls: dto.imageUrls ?? [],
        status: dto.status,
      },
    });

    await this.prisma.productRegionRate.createMany({
      data: dto.brandRegionRates.map((r) => ({
        productId: product.id,
        region: r.region,
        rate: r.rate,
      })),
    });

    await this.prisma.vendorRegionRate.createMany({
      data: dto.vendorRegionRates.map((r) => ({
        productId: product.id,
        region: r.region,
        rate: r.rate,
      })),
    });

    return this.findOne(tenantId, product.id);
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

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          regionRates: true,
          vendorRegionRates: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.product.count({ where }),
    ]);

    const data = products.map(({ regionRates, ...rest }) => ({
      ...rest,
      brandRegionRates: regionRates,
    }));

    return buildPaginated(data, total, p, size);
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        category: true,
        regionRates: true,
        vendorRegionRates: true,
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    const { regionRates, ...rest } = product;
    return { ...rest, brandRegionRates: regionRates };
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(tenantId, id);

    const { brandRegionRates, vendorRegionRates, ...productData } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (brandRegionRates && brandRegionRates.length > 0) {
        await Promise.all(
          brandRegionRates.map((r) =>
            tx.productRegionRate.upsert({
              where: { productId_region: { productId: id, region: r.region } },
              update: { rate: r.rate },
              create: { productId: id, region: r.region, rate: r.rate },
            }),
          ),
        );
      }

      if (vendorRegionRates && vendorRegionRates.length > 0) {
        await Promise.all(
          vendorRegionRates.map((r) =>
            tx.vendorRegionRate.upsert({
              where: { productId_region: { productId: id, region: r.region } },
              update: { rate: r.rate },
              create: { productId: id, region: r.region, rate: r.rate },
            }),
          ),
        );
      }

      return tx.product.update({ where: { id }, data: productData });
    });
  }

  async updateBrandRegionRates(
    tenantId: string,
    productId: string,
    rates: RegionRateInput[],
  ) {
    await this.findOne(tenantId, productId); // ensures product exists + belongs to tenant

    await Promise.all(
      rates.map((r) =>
        this.prisma.productRegionRate.upsert({
          where: { productId_region: { productId, region: r.region } },
          update: { rate: r.rate },
          create: { productId, region: r.region, rate: r.rate },
        }),
      ),
    );

    return this.findOne(tenantId, productId);
  }

  async updateVendorRegionRates(
    tenantId: string,
    productId: string,
    rates: RegionRateInput[],
  ) {
    await this.findOne(tenantId, productId);

    await Promise.all(
      rates.map((r) =>
        this.prisma.vendorRegionRate.upsert({
          where: { productId_region: { productId, region: r.region } },
          update: { rate: r.rate },
          create: { productId, region: r.region, rate: r.rate },
        }),
      ),
    );

    return this.findOne(tenantId, productId);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ===== Categories =====

  async createCategory(tenantId: string, dto: CreateCategoryDto) {
    const existing = await this.prisma.productCategory.findFirst({
      where: { tenantId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException('Category already exists');
    return this.prisma.productCategory.create({ data: { tenantId, ...dto } });
  }

  async findAllCategories(
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

    const [categories, total] = await Promise.all([
      this.prisma.productCategory.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      this.prisma.productCategory.count({ where }),
    ]);

    return buildPaginated(categories, total, p, size);
  }
}
