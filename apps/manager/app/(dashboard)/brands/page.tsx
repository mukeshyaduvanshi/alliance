"use client";

import { AccessDenied } from "@/components/access-denied";
import { BrandList } from "@/features/brands/brand-list";
import { usePermission } from "@/lib/permissions";

export default function BrandsPage() {
  const allowed = usePermission("brand", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <BrandList />;
}
