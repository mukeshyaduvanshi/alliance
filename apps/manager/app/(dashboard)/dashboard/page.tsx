"use client";

import { AccessDenied } from "@/components/access-denied";
import { DashboardOverview } from "@/features/dashboard/dashboard-overview";
import { usePermission } from "@/lib/permissions";

export default function ManagerDashboardPage() {
  const allowed = usePermission("dashboard", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <DashboardOverview />;
}
