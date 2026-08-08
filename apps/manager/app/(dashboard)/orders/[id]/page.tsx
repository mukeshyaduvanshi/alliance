"use client";

import { AccessDenied } from "@/components/access-denied";
import { OrderDetail } from "@/features/orders/order-detail";
import { usePermission } from "@/lib/permissions";

export default function OrderDetailPage() {
  const allowed = usePermission("order", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <OrderDetail />;
}
