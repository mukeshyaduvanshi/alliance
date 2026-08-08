"use client";

import { AccessDenied } from "@/components/access-denied";
import { EmailLogs } from "@/features/messages/message-logs";
import { usePermission } from "@/lib/permissions";

export default function EmailLogsPage() {
  const allowed = usePermission("system_admin", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <EmailLogs />;
}
