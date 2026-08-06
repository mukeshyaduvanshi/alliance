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
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';

@Injectable()
export class PurchaseOrderService {
  constructor(private prisma: PrismaService) {}

  async create(
    tenantId: string,
    brandId: string,
    dto: CreatePurchaseOrderDto,
    createdById: string,
  ) {
    const existing = await this.prisma.purchaseOrder.findFirst({
      where: { tenantId, poNumber: dto.poNumber },
    });
    if (existing) throw new ConflictException('PO number already exists');

    return this.prisma.purchaseOrder.create({
      data: {
        tenantId,
        brandId,
        poNumber: dto.poNumber,
        totalBudget: dto.totalBudget,
        createdById,
      },
    });
  }

  async findAll(
    tenantId: string,
    page?: string | number,
    pageSize?: string | number,
  ): Promise<Paginated<Record<string, unknown>>> {
    const { skip, take, page: p, pageSize: size } = getPagination(page, pageSize);
    const where = { tenantId };

    const [pos, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: { brand: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return buildPaginated(pos, total, p, size);
  }

  async findAllForBrand(
    tenantId: string,
    brandId: string,
    page?: string | number,
    pageSize?: string | number,
  ): Promise<Paginated<Record<string, unknown>>> {
    const { skip, take, page: p, pageSize: size } = getPagination(page, pageSize);
    const where = { tenantId, brandId };

    const [pos, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: { brand: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return buildPaginated(pos, total, p, size);
  }

  async updateStatus(tenantId: string, id: string, isActive: boolean) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
    });
    if (!po) throw new NotFoundException('Purchase Order not found');
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { isActive },
    });
  }
}
