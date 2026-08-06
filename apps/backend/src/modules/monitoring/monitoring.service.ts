import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPaginated,
  getPagination,
  type Paginated,
} from '../../common/pagination';
import { CreateSlaRuleDto } from './dto/create-sla-rule.dto';

@Injectable()
export class MonitoringService {
  constructor(private prisma: PrismaService) {}

  // ===== SLA Rules (Admin config) =====

  async createSlaRule(tenantId: string, dto: CreateSlaRuleDto) {
    const existing = await this.prisma.slaRule.findFirst({
      where: { tenantId, appliesToStatus: dto.appliesToStatus },
    });
    if (existing)
      throw new BadRequestException(
        'An SLA rule already exists for this status',
      );

    return this.prisma.slaRule.create({ data: { tenantId, ...dto } });
  }

  async listSlaRules(
    tenantId: string,
    page?: string | number,
    pageSize?: string | number,
  ): Promise<Paginated<Record<string, unknown>>> {
    const { skip, take, page: p, pageSize: size } = getPagination(page, pageSize);
    const where = { tenantId };

    const [rules, total] = await Promise.all([
      this.prisma.slaRule.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.slaRule.count({ where }),
    ]);

    return buildPaginated(rules, total, p, size);
  }

  // ===== KAM Assignment =====

  async assignKam(tenantId: string, brandId: string, kamUserId: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { id: brandId, tenantId },
    });
    if (!brand) throw new NotFoundException('Brand not found');

    return this.prisma.brand.update({
      where: { id: brandId },
      data: { assignedKamId: kamUserId },
    });
  }

  // ===== KAM Dashboard =====

  async getKamDashboard(tenantId: string, kamUserId: string) {
    const brands = await this.prisma.brand.findMany({
      where: { tenantId, assignedKamId: kamUserId, deletedAt: null },
      select: { id: true, brandName: true, approvalStatus: true },
    });

    const brandIds = brands.map((b) => b.id);

    const pendingOrders = await this.prisma.order.count({
      where: {
        brandId: { in: brandIds },
        status: { notIn: ['DELIVERED', 'PAYMENT_RECEIVED', 'CANCELLED'] },
      },
    });

    const orderIds = (
      await this.prisma.order.findMany({
        where: { brandId: { in: brandIds } },
        select: { id: true },
      })
    ).map((o) => o.id);

    const activeAlerts = await this.prisma.exceptionAlert.count({
      where: {
        tenantId,
        isResolved: false,
        entityType: 'Order',
        entityId: { in: orderIds },
      },
    });

    const recentOrders = await this.prisma.order.findMany({
      where: { brandId: { in: brandIds } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { brand: true },
    });

    return {
      totalBrands: brands.length,
      brands,
      pendingOrders,
      activeAlerts,
      recentOrders,
    };
  }

  // ===== Performance Dashboard =====

  async getPerformanceDashboard(tenantId: string) {
    const [vendorStats, brandStats] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['vendorId'],
        where: { tenantId, vendorId: { not: null } },
        _count: { id: true },
      }),
      this.prisma.order.groupBy({
        by: ['brandId'],
        where: { tenantId },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
    ]);

    return { vendorStats, brandStats };
  }

  // ===== SLA Status Check (used by both dashboard + background job) =====

  async getBreachedOrders(tenantId: string) {
    const rules = await this.prisma.slaRule.findMany({
      where: { tenantId, isActive: true },
    });
    const breached: any[] = [];

    for (const rule of rules) {
      const cutoff = new Date(
        Date.now() - rule.thresholdHours * 60 * 60 * 1000,
      );

      const orders = await this.prisma.order.findMany({
        where: {
          tenantId,
          status: rule.appliesToStatus,
          updatedAt: { lt: cutoff },
        },
      });

      breached.push(...orders.map((o) => ({ order: o, rule })));
    }

    return breached;
  }

  // ===== Exception Alerts =====

  async createAlert(
    tenantId: string,
    type: string,
    severity: string,
    message: string,
    entityType: string,
    entityId: string,
  ) {
    return this.prisma.exceptionAlert.create({
      data: {
        tenantId,
        type: type as any,
        severity: severity as any,
        message,
        entityType,
        entityId,
      },
    });
  }

  async listAlerts(
    tenantId: string,
    isResolved?: boolean,
    page?: string | number,
    pageSize?: string | number,
  ): Promise<Paginated<Record<string, unknown>>> {
    const { skip, take, page: p, pageSize: size } = getPagination(page, pageSize);
    const where = {
      tenantId,
      ...(isResolved !== undefined ? { isResolved } : {}),
    };

    const [alerts, total] = await Promise.all([
      this.prisma.exceptionAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.exceptionAlert.count({ where }),
    ]);

    return buildPaginated(alerts, total, p, size);
  }

  async resolveAlert(tenantId: string, alertId: string, userId: string) {
    const alert = await this.prisma.exceptionAlert.findFirst({
      where: { id: alertId, tenantId },
    });
    if (!alert) throw new NotFoundException('Alert not found');

    return this.prisma.exceptionAlert.update({
      where: { id: alertId },
      data: { isResolved: true, resolvedById: userId, resolvedAt: new Date() },
    });
  }
}
