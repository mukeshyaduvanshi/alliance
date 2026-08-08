"use client";

import { AccessDenied } from "@/components/access-denied";
import { OrdersOverview } from "@/features/orders/orders-overview";
import { usePermission } from "@/lib/permissions";

export default function OrdersPage() {
  const allowed = usePermission("order", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <OrdersOverview />;
}
