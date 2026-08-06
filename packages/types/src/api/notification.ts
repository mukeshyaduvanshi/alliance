import { NotificationRecipientType } from "../enums";

export interface NotificationDto {
  id: string;
  tenantId: string;
  recipientType: NotificationRecipientType;
  recipientId: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountDto {
  count: number;
}

export interface MarkReadInput {
  id: string;
}

export interface SendNotificationDto {
  recipientType: NotificationRecipientType;
  recipientId: string;
  title: string;
  message: string;
  link?: string;
}
