"use client";

import { AccessDenied } from "@/components/access-denied";
import { PendingApprovals } from "@/features/approvals/pending";
import { usePermission } from "@/lib/permissions";

export default function ApprovalsPage() {
  const allowed = usePermission("workflow", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <PendingApprovals />;
}
