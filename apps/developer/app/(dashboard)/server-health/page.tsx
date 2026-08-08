"use client";

import { AccessDenied } from "@/components/access-denied";
import { ServerHealth } from "@/features/health/server-health";
import { usePermission } from "@/lib/permissions";

export default function ServerHealthPage() {
  const allowed = usePermission("system_admin", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <ServerHealth />;
}
