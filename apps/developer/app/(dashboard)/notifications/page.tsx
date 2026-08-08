"use client";

import { AccessDenied } from "@/components/access-denied";
import { NotificationsList } from "@/features/notifications/notifications-list";
import { usePermission } from "@/lib/permissions";

export default function NotificationsPage() {
  const allowed = usePermission("notification", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <NotificationsList />;
}
