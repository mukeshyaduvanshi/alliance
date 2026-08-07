import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VendorJwtAuthGuard } from '../vendor/guards/vendor-jwt-auth.guard';
import { NotificationService } from './notification.service';

@UseGuards(VendorJwtAuthGuard)
@Controller('vendor/notifications')
export class VendorNotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('isRead') isRead?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const read = isRead === undefined ? undefined : isRead === 'true';
    return this.notificationService.listForRecipient(
      req.user.tenantId,
      'VENDOR',
      req.user.vendorId,
      read,
      page,
      pageSize,
    );
  }

  @Get('unread-count')
  unreadCount(@Req() req: any) {
    return this.notificationService.getUnreadCount(
      req.user.tenantId,
      'VENDOR',
      req.user.vendorId,
    );
  }

  @Patch(':id/read')
  markRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationService.markAsRead(
      req.user.tenantId,
      req.user.vendorId,
      id,
    );
  }

  @Patch('read-all')
  markAllRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(
      req.user.tenantId,
      'VENDOR',
      req.user.vendorId,
    );
  }
}
