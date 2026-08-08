import type { OrderStatus } from "@cj/types";

export function orderStatusVariant(
  status: OrderStatus
): "default" | "success" | "warning" | "info" | "violet" | "destructive" | "secondary" | "outline" | "ghost" | "link" {
  switch (status) {
    case "DELIVERED":
    case "ARTWORK_APPROVED":
    case "PAYMENT_RECEIVED":
      return "success";
    case "CANCELLED":
    case "ARTWORK_REJECTED":
      return "destructive";
    case "PENDING_BRAND_APPROVAL":
    case "PENDING_VENDOR_ASSIGNMENT":
    case "PAYMENT_PENDING":
      return "warning";
    case "IN_PRODUCTION":
      return "violet";
    case "PLACED":
    case "CREATIVE_IN_PROGRESS":
    case "VENDOR_ASSIGNED":
    case "INSTALLATION_COMPLETE":
    default:
      return "info";
  }
}
