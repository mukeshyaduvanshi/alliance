import type { BadgeVariant } from "@cj/ui";

export function orderBadge(status: string): BadgeVariant {
  if (["DELIVERED", "ARTWORK_APPROVED", "PAYMENT_RECEIVED"].includes(status))
    return "success";
  if (["CANCELLED", "ARTWORK_REJECTED"].includes(status)) return "destructive";
  if (["PENDING_BRAND_APPROVAL", "PENDING_VENDOR_ASSIGNMENT", "PAYMENT_PENDING"].includes(status))
    return "warning";
  if (status === "IN_PRODUCTION") return "violet";
  return "info";
}

export function approvalBadge(status: string): BadgeVariant {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "destructive";
  return "warning";
}

export function invoiceBadge(status: string): BadgeVariant {
  if (status === "PAID") return "success";
  if (status === "OVERDUE") return "destructive";
  if (status === "ISSUED") return "info";
  return "secondary";
}
