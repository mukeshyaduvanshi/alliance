import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProposeNegotiationDto } from './dto/propose-negotiation.dto';
import { RespondNegotiationDto } from './dto/respond-negotiation.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class OrderNegotiationService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  // Called internally when Admin assigns a Vendor — computes the vendor's payout amount
  async computeVendorAmounts(orderId: string, vendorId: string) {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });

    let vendorTotal = 0;

    for (const item of order.items) {
      const vendorRate = await this.prisma.vendorProductRate.findFirst({
        where: { vendorId, productId: item.productId, isActive: true },
        include: { product: { include: { vendorRegionRates: true } } },
      });

      const rate = vendorRate
        ? vendorRate.product.vendorRegionRates.find(
            (rr) => rr.region === vendorRate.region,
          )?.rate
        : null;

      const vendorAmount = rate ? Number(rate) * Number(item.quantity) : 0;

      await this.prisma.orderItem.update({
        where: { id: item.id },
        data: { vendorRateSnapshot: rate ?? null, vendorAmount },
      });

      vendorTotal += vendorAmount;
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { vendorTotalAmount: vendorTotal },
    });
  }

  // Vendor's own orders (once assigned)
  async findAllForVendor(vendorId: string, status?: string) {
    return this.prisma.order.findMany({
      where: {
        vendorId,
        deletedAt: null,
        ...(status ? { status: status as any } : {}),
      },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForVendor(vendorId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, vendorId, deletedAt: null },
      include: {
        items: { include: { product: true } },
        artworks: true,
        negotiations: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  // Vendor proposes a negotiation — creates a NEW row every time (full history preserved)
  async propose(
    tenantId: string,
    orderId: string,
    vendorId: string,
    dto: ProposeNegotiationDto,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, vendorId, tenantId },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (!['VENDOR_ASSIGNED', 'IN_PRODUCTION'].includes(order.status)) {
      throw new BadRequestException(
        'Negotiation is only allowed after vendor assignment',
      );
    }

    return this.prisma.orderNegotiation.create({
      data: {
        tenantId,
        orderId,
        vendorId,
        proposedAmount: dto.proposedAmount,
        remarks: dto.remarks,
        status: 'PENDING',
      },
    });
  }

  // Managers view full negotiation history for an order
  async listForManagers(tenantId: string, orderId: string) {
    return this.prisma.orderNegotiation.findMany({
      where: { tenantId, orderId },
      include: { vendor: true, respondedBy: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Manager accepts/rejects
  async respond(
    tenantId: string,
    negotiationId: string,
    userId: string,
    dto: RespondNegotiationDto,
  ) {
    const negotiation = await this.prisma.orderNegotiation.findFirst({
      where: { id: negotiationId, tenantId },
    });
    if (!negotiation) throw new NotFoundException('Negotiation not found');
    if (negotiation.status !== 'PENDING')
      throw new BadRequestException(
        'This negotiation has already been responded to',
      );

    const updated = await this.prisma.orderNegotiation.update({
      where: { id: negotiationId },
      data: {
        status: dto.status,
        respondedById: userId,
        responseRemarks: dto.responseRemarks,
        respondedAt: new Date(),
      },
    });

    await this.notificationService.notify({
      tenantId,
      recipientType: 'VENDOR',
      recipientId: negotiation.vendorId,
      title: `Negotiation ${dto.status === 'ACCEPTED' ? 'Accepted' : 'Rejected'}`,
      message:
        dto.responseRemarks ??
        `Your proposed rate has been ${dto.status.toLowerCase()}.`,
      link: `/orders/${negotiation.orderId}`,
    });

    if (dto.status === 'ACCEPTED') {
      await this.prisma.order.update({
        where: { id: negotiation.orderId },
        data: { vendorTotalAmount: negotiation.proposedAmount },
      });
    }

    return updated;
  }
}
