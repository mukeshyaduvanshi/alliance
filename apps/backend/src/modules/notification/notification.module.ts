import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { BrandNotificationController } from './brand-notification.controller';
import { VendorNotificationController } from './vendor-notification.controller';

@Module({
  controllers: [
    NotificationController,
    BrandNotificationController,
    VendorNotificationController,
  ],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
