"use client";

import { AccessDenied } from "@/components/access-denied";
import { NegotiationsOverview } from "@/features/orders/negotiations";
import { usePermission } from "@/lib/permissions";

export default function NegotiationsPage() {
  const allowed = usePermission("order", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <NegotiationsOverview />;
}
