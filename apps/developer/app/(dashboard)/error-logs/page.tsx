"use client";

import { AccessDenied } from "@/components/access-denied";
import { ErrorLogs } from "@/features/error-logs/error-logs";
import { usePermission } from "@/lib/permissions";

export default function ErrorLogsPage() {
  const allowed = usePermission("system_admin", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <ErrorLogs />;
}
