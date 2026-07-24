import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  findAll(@Req() req: any, @Query('isRead') isRead?: string) {
    const read = isRead === undefined ? undefined : isRead === 'true';
    return this.notificationService.listForRecipient(
      req.user.tenantId,
      'INTERNAL_USER',
      req.user.userId,
      read,
    );
  }

  @Get('unread-count')
  unreadCount(@Req() req: any) {
    return this.notificationService.getUnreadCount(
      req.user.tenantId,
      'INTERNAL_USER',
      req.user.userId,
    );
  }

  @Patch(':id/read')
  markRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationService.markAsRead(
      req.user.tenantId,
      req.user.userId,
      id,
    );
  }

  @Patch('read-all')
  markAllRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(
      req.user.tenantId,
      'INTERNAL_USER',
      req.user.userId,
    );
  }
}
