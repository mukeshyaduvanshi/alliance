"use client";

import { AccessDenied } from "@/components/access-denied";
import { VendorList } from "@/features/vendors/vendor-list";
import { usePermission } from "@/lib/permissions";

export default function VendorsPage() {
  const allowed = usePermission("vendor", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <VendorList />;
}
