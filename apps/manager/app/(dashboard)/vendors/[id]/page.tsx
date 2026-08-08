"use client";

import { AccessDenied } from "@/components/access-denied";
import { VendorDetail } from "@/features/vendors/vendor-detail";
import { usePermission } from "@/lib/permissions";

export default function VendorDetailPage() {
  const allowed = usePermission("vendor", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <VendorDetail />;
}
