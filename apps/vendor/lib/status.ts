import type { BadgeVariant } from "@cj/ui";

export function orderBadge(status: string): BadgeVariant {
  if (["DELIVERED", "PAYMENT_RECEIVED", "ARTWORK_APPROVED"].includes(status))
    return "success";
  if (["CANCELLED", "ARTWORK_REJECTED"].includes(status)) return "destructive";
  if (["PENDING_BRAND_APPROVAL", "PAYMENT_PENDING"].includes(status))
    return "warning";
  if (status === "IN_PRODUCTION") return "violet";
  return "info";
}

export function approvalBadge(status: string): BadgeVariant {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "destructive";
  return "warning";
}
