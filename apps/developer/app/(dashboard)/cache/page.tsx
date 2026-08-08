"use client";

import { AccessDenied } from "@/components/access-denied";
import { CacheStorage } from "@/features/cache/cache-storage";
import { usePermission } from "@/lib/permissions";

export default function CachePage() {
  const allowed = usePermission("system_admin", "VIEW");

  if (!allowed) return <AccessDenied />;

  return <CacheStorage />;
}
