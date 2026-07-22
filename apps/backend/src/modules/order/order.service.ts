import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus } from '@database/database';
import { CreateOrderDto } from './dto/create-order.dto';
import { SubmitArtworkDto } from './dto/submit-artwork.dto';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  private async resolveOrderItems(
    brandId: string,
    items: { productId: string; quantity: number }[],
  ) {
    return Promise.all(
      items.map(async (item) => {
        const brandRate = await this.prisma.brandProductRate.findFirst({
          where: { brandId, productId: item.productId, isActive: true },
          include: { product: { include: { regionRates: true } } },
        });
        if (!brandRate)
          throw new BadRequestException(
            `Product ${item.productId} not available for your account`,
          );

        const rate = brandRate.isCustomRate
          ? brandRate.customRate
          : brandRate.product.regionRates.find(
              (rr) => rr.region === brandRate.region,
            )?.rate;

        if (!rate)
          throw new BadRequestException(
            'No rate configured for this product/region',
          );

        return {
          productId: item.productId,
          region: brandRate.region,
          quantity: item.quantity,
          rateSnapshot: rate,
          amount: Number(rate) * item.quantity,
        };
      }),
    );
  }

  private async generateOrderNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.order.count({ where: { tenantId } });
    return `CJ-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  async placeOrder(tenantId: string, brandId: string, dto: CreateOrderDto) {
    const itemsWithRates = await this.resolveOrderItems(brandId, dto.items);
    const totalAmount = itemsWithRates.reduce((sum, i) => sum + i.amount, 0);

    if (dto.poId) {
      const po = await this.prisma.purchaseOrder.findFirst({
        where: { id: dto.poId, brandId, isActive: true },
      });
      if (!po)
        throw new NotFoundException('Purchase Order not found or inactive');

      const remaining = Number(po.totalBudget) - Number(po.consumedAmount);
      if (totalAmount > remaining) {
        throw new BadRequestException(
          `Insufficient PO budget. Remaining: ${remaining}`,
        );
      }
    }

    const orderNumber = await this.generateOrderNumber(tenantId);
    const initialStatus: OrderStatus =
      dto.artworkSubmissionType === 'REFERENCE'
        ? 'CREATIVE_IN_PROGRESS'
        : 'PENDING_VENDOR_ASSIGNMENT';

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          tenantId,
          brandId,
          poId: dto.poId,
          orderNumber,
          totalAmount,
          siteLocation: dto.siteLocation,
          artworkSubmissionType: dto.artworkSubmissionType,
          status: initialStatus,
          items: { createMany: { data: itemsWithRates } },
          artworks: {
            create: {
              type: dto.artworkSubmissionType as any,
              fileUrl: dto.artworkFileUrl,
              fileName: dto.artworkFileName,
            },
          },
        },
      });

      if (dto.poId) {
        await tx.purchaseOrder.update({
          where: { id: dto.poId },
          data: { consumedAmount: { increment: totalAmount } },
        });
      }

      return created;
    });
  }

  async findAll(
    tenantId: string,
    status?: string,
    brandId?: string,
    vendorId?: string,
  ) {
    return this.prisma.order.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(status ? { status: status as any } : {}),
        ...(brandId ? { brandId } : {}),
        ...(vendorId ? { vendorId } : {}),
      },
      include: { brand: true, vendor: true, items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        brand: true,
        vendor: true,
        po: true,
        items: { include: { product: true } },
        artworks: { orderBy: { uploadedAt: 'asc' } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findAllForBrand(brandId: string, status?: string) {
    return this.prisma.order.findMany({
      where: {
        brandId,
        deletedAt: null,
        ...(status ? { status: status as any } : {}),
      },
      include: { items: true, vendor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForBrand(brandId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, brandId, deletedAt: null },
      include: {
        items: { include: { product: true } },
        artworks: true,
        vendor: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async submitCreativeArtwork(
    tenantId: string,
    orderId: string,
    userId: string,
    dto: SubmitArtworkDto,
  ) {
    const order = await this.getOrderOrThrow(tenantId, orderId);
    if (order.status !== 'CREATIVE_IN_PROGRESS') {
      throw new BadRequestException('Order is not awaiting creative work');
    }

    const lastVersion = await this.prisma.orderArtwork.findFirst({
      where: { orderId, type: 'CREATIVE_ARTWORK' },
      orderBy: { version: 'desc' },
    });

    await this.prisma.orderArtwork.create({
      data: {
        orderId,
        type: 'CREATIVE_ARTWORK',
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        version: (lastVersion?.version ?? 0) + 1,
        uploadedByUserId: userId,
      },
    });

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'PENDING_BRAND_APPROVAL' },
    });
  }

  async approveArtwork(tenantId: string, orderId: string, brandId: string) {
    const order = await this.getOrderForBrand(tenantId, orderId, brandId);
    if (order.status !== 'PENDING_BRAND_APPROVAL') {
      throw new BadRequestException('No artwork pending your approval');
    }
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'PENDING_VENDOR_ASSIGNMENT' },
    });
  }

  async rejectArtwork(tenantId: string, orderId: string, brandId: string) {
    const order = await this.getOrderForBrand(tenantId, orderId, brandId);
    if (order.status !== 'PENDING_BRAND_APPROVAL') {
      throw new BadRequestException('No artwork pending your approval');
    }
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CREATIVE_IN_PROGRESS' },
    });
  }

  async assignVendor(tenantId: string, orderId: string, vendorId: string) {
    const order = await this.getOrderOrThrow(tenantId, orderId);
    if (order.status !== 'PENDING_VENDOR_ASSIGNMENT') {
      throw new BadRequestException('Order is not ready for vendor assignment');
    }
    return this.prisma.order.update({
      where: { id: orderId },
      data: { vendorId, status: 'VENDOR_ASSIGNED' },
    });
  }

  async updateStatus(tenantId: string, orderId: string, status: OrderStatus) {
    const order = await this.getOrderOrThrow(tenantId, orderId);

    const validTransitions: Record<string, string[]> = {
      VENDOR_ASSIGNED: ['IN_PRODUCTION', 'CANCELLED'],
      IN_PRODUCTION: ['INSTALLATION_COMPLETE'],
      INSTALLATION_COMPLETE: ['PAYMENT_PENDING'],
      PAYMENT_PENDING: ['PAYMENT_RECEIVED'],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      throw new BadRequestException(
        `Cannot move from ${order.status} to ${status}`,
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }

  async cancelOrder(tenantId: string, orderId: string, brandId: string) {
    const order = await this.getOrderForBrand(tenantId, orderId, brandId);
    const cancellable = [
      'PLACED',
      'CREATIVE_IN_PROGRESS',
      'PENDING_BRAND_APPROVAL',
      'PENDING_VENDOR_ASSIGNMENT',
      'VENDOR_ASSIGNED',
    ];

    if (!cancellable.includes(order.status)) {
      throw new BadRequestException('Order can no longer be cancelled');
    }

    return this.prisma.$transaction(async (tx) => {
      if (order.poId) {
        await tx.purchaseOrder.update({
          where: { id: order.poId },
          data: { consumedAmount: { decrement: order.totalAmount } },
        });
      }
      return tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
    });
  }

  private async getOrderOrThrow(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  private async getOrderForBrand(
    tenantId: string,
    id: string,
    brandId: string,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId, brandId, deletedAt: null },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
