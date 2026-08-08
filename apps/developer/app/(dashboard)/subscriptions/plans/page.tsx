"use client";

import { AccessDenied } from "@/components/access-denied";
import { SubscriptionPlans } from "@/features/subscriptions/subscriptions";
import { usePermission } from "@/lib/permissions";

export default function SubscriptionPlansPage() {
  const allowed = usePermission("system_admin", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <SubscriptionPlans />;
}
