import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BrandJwtAuthGuard } from '../brand/guards/brand-jwt-auth.guard';
import { NotificationService } from './notification.service';

@UseGuards(BrandJwtAuthGuard)
@Controller('brand/notifications')
export class BrandNotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  findAll(@Req() req: any, @Query('isRead') isRead?: string) {
    const read = isRead === undefined ? undefined : isRead === 'true';
    return this.notificationService.listForRecipient(
      req.user.tenantId,
      'BRAND',
      req.user.brandId,
      read,
    );
  }

  @Get('unread-count')
  unreadCount(@Req() req: any) {
    return this.notificationService.getUnreadCount(
      req.user.tenantId,
      'BRAND',
      req.user.brandId,
    );
  }

  @Patch(':id/read')
  markRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationService.markAsRead(
      req.user.tenantId,
      req.user.brandId,
      id,
    );
  }

  @Patch('read-all')
  markAllRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(
      req.user.tenantId,
      'BRAND',
      req.user.brandId,
    );
  }
}
