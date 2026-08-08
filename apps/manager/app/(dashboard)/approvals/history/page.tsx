"use client";

import { AccessDenied } from "@/components/access-denied";
import { ApprovalHistory } from "@/features/approvals/history";
import { usePermission } from "@/lib/permissions";

export default function ApprovalHistoryPage() {
  const allowed = usePermission("workflow", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <ApprovalHistory />;
}
