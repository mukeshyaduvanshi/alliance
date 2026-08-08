"use client";

import { AccessDenied } from "@/components/access-denied";
import { AlertsOverview } from "@/features/sla/alerts-overview";
import { usePermission } from "@/lib/permissions";

export default function AlertsPage() {
  const allowed = usePermission("alert", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <AlertsOverview />;
}
