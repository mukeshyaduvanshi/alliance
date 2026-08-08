"use client";

import { AccessDenied } from "@/components/access-denied";
import { QueuesOverview } from "@/features/queues/queues";
import { usePermission } from "@/lib/permissions";

export default function QueuesPage() {
  const allowed = usePermission("system_admin", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <QueuesOverview />;
}
