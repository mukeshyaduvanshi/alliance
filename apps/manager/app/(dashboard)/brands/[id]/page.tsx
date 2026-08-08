"use client";

import { AccessDenied } from "@/components/access-denied";
import { BrandDetail } from "@/features/brands/brand-detail";
import { usePermission } from "@/lib/permissions";

export default function BrandDetailPage() {
  const allowed = usePermission("brand", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <BrandDetail />;
}
