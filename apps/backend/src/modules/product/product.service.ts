import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
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
    return this.prisma.product.create({ data: { tenantId, ...dto } });
  }

  async findAll(tenantId: string) {
    return this.prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(tenantId, id);
    return this.prisma.product.update({ where: { id }, data: dto });
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

  async findAllCategories(tenantId: string) {
    return this.prisma.productCategory.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }
}
