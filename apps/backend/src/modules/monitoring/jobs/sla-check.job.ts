import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonitoringService } from '../monitoring.service';

@Injectable()
export class SlaCheckJob {
  private readonly logger = new Logger(SlaCheckJob.name);

  constructor(
    private prisma: PrismaService,
    private monitoringService: MonitoringService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkAllTenants() {
    const tenants = await this.prisma.tenant.findMany({
      where: { isActive: true },
    });

    for (const tenant of tenants) {
      const breached = await this.monitoringService.getBreachedOrders(
        tenant.id,
      );

      for (const { order, rule } of breached) {
        const existing = await this.prisma.exceptionAlert.findFirst({
          where: {
            tenantId: tenant.id,
            entityType: 'Order',
            entityId: order.id,
            isResolved: false,
            type: 'SLA_BREACH',
          },
        });
        if (existing) continue; // don't duplicate

        await this.monitoringService.createAlert(
          tenant.id,
          'SLA_BREACH',
          'HIGH',
          `Order ${order.orderNumber} has exceeded SLA for status ${rule.appliesToStatus} (${rule.thresholdHours}h)`,
          'Order',
          order.id,
        );
      }
    }
  }
}
