"use client";

import { AccessDenied } from "@/components/access-denied";
import { Backups } from "@/features/backups/backups";
import { usePermission } from "@/lib/permissions";

export default function BackupsPage() {
  const allowed = usePermission("system_admin", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <Backups />;
}
