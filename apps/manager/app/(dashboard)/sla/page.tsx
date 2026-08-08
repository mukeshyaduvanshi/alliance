"use client";

import { AccessDenied } from "@/components/access-denied";
import { SlaOverview } from "@/features/sla/sla-overview";
import { usePermission } from "@/lib/permissions";

export default function SlaPage() {
  const allowed = usePermission("sla_rule", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <SlaOverview />;
}
