"use client";

import { AccessDenied } from "@/components/access-denied";
import { DashboardOverview } from "@/features/dashboard/dashboard-overview";
import { usePermission } from "@/lib/permissions";

export default function DeveloperDashboardPage() {
  const allowed = usePermission("system_admin", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <DashboardOverview />;
}
