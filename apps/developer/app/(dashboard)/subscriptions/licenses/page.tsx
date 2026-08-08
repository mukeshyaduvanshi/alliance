"use client";

import { AccessDenied } from "@/components/access-denied";
import { Licenses } from "@/features/subscriptions/subscriptions";
import { usePermission } from "@/lib/permissions";

export default function LicensesPage() {
  const allowed = usePermission("system_admin", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <Licenses />;
}
