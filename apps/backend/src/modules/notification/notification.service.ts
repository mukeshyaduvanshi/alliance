import { Injectable, Logger } from '@nestjs/common';
import { NotificationRecipientType } from '@database/database';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPaginated,
  getPagination,
  type Paginated,
} from '../../common/pagination';

export interface NotifyInput {
  tenantId: string;
  recipientType: NotificationRecipientType;
  recipientId: string;
  title: string;
  message: string;
  link?: string;
  email?: { to: string; subject: string; html: string };
  sms?: { to: string; message: string };
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private prisma: PrismaService) {}

  // ===== Core combined trigger — call this from anywhere in the app =====

  async notify(input: NotifyInput) {
    // 1. Always create in-app notification (dashboard bell)
    await this.createInApp(
      input.tenantId,
      input.recipientType,
      input.recipientId,
      input.title,
      input.message,
      input.link,
    );

    // 2. Optionally send email
    if (input.email) {
      await this.sendEmail(
        input.tenantId,
        input.email.to,
        input.email.subject,
        input.email.html,
      );
    }

    // 3. Optionally send SMS
    if (input.sms) {
      await this.sendSms(input.tenantId, input.sms.to, input.sms.message);
    }
  }

  // ===== In-App Notification =====

  async createInApp(
    tenantId: string,
    recipientType: NotificationRecipientType,
    recipientId: string,
    title: string,
    message: string,
    link?: string,
  ) {
    return this.prisma.notification.create({
      data: { tenantId, recipientType, recipientId, title, message, link },
    });
  }

  async listForRecipient(
    tenantId: string,
    recipientType: NotificationRecipientType,
    recipientId: string,
    isRead?: boolean,
    page?: string | number,
    pageSize?: string | number,
  ): Promise<Paginated<Record<string, unknown>>> {
    const { skip, take, page: p, pageSize: size } = getPagination(page, pageSize, 20);
    const where = {
      tenantId,
      recipientType,
      recipientId,
      ...(isRead !== undefined ? { isRead } : {}),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return buildPaginated(notifications, total, p, size);
  }

  async markAsRead(
    tenantId: string,
    recipientId: string,
    notificationId: string,
  ) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, tenantId, recipientId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(
    tenantId: string,
    recipientType: NotificationRecipientType,
    recipientId: string,
  ) {
    return this.prisma.notification.updateMany({
      where: { tenantId, recipientType, recipientId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(
    tenantId: string,
    recipientType: NotificationRecipientType,
    recipientId: string,
  ) {
    const count = await this.prisma.notification.count({
      where: { tenantId, recipientType, recipientId, isRead: false },
    });
    return { unreadCount: count };
  }

  // ===== Email via Resend =====

  async sendEmail(tenantId: string, to: string, subject: string, html: string) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL,
          to,
          subject,
          html,
        }),
      });

      const success = response.ok;
      const responseBody = await response.json().catch(() => ({}));

      await this.prisma.emailLog.create({
        data: {
          tenantId,
          toAddress: to,
          subject,
          status: success ? 'SENT' : 'FAILED',
          errorMessage: success ? null : JSON.stringify(responseBody),
        },
      });

      if (!success)
        this.logger.error(
          `Email failed to ${to}: ${JSON.stringify(responseBody)}`,
        );
      return success;
    } catch (err: any) {
      await this.prisma.emailLog.create({
        data: {
          tenantId,
          toAddress: to,
          subject,
          status: 'FAILED',
          errorMessage: err.message,
        },
      });
      this.logger.error(`Email send error: ${err.message}`);
      return false;
    }
  }

  // ===== SMS via Fast2SMS =====

  async sendSms(tenantId: string, to: string, message: string) {
    try {
      const url = `https://www.fast2sms.com/dev/bulkV2`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          authorization: process.env.FAST2SMS_API_KEY as string,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q', // quick transactional route — adjust per Fast2SMS account setup
          message,
          numbers: to,
        }),
      });

      const responseBody = await response.json().catch(() => ({}));
      const success = response.ok && responseBody.return === true;

      await this.prisma.smsLog.create({
        data: {
          tenantId,
          toPhone: to,
          message,
          status: success ? 'SENT' : 'FAILED',
          errorMessage: success ? null : JSON.stringify(responseBody),
        },
      });

      if (!success)
        this.logger.error(
          `SMS failed to ${to}: ${JSON.stringify(responseBody)}`,
        );
      return success;
    } catch (err: any) {
      await this.prisma.smsLog.create({
        data: {
          tenantId,
          toPhone: to,
          message,
          status: 'FAILED',
          errorMessage: err.message,
        },
      });
      this.logger.error(`SMS send error: ${err.message}`);
      return false;
    }
  }
}
