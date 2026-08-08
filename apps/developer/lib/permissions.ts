import { useMemo } from "react";

import { hasPermission } from "@cj/utils";

import { session } from "@/lib/session";

export function usePermission(module: string, action: string): boolean {
  return useMemo(() => {
    const s = session.get();
    if (!s) return false;
    return hasPermission(module, action, s);
  }, [module, action]);
}

export function hasPermissionNow(module: string, action: string): boolean {
  const s = session.get();
  if (!s) return false;
  return hasPermission(module, action, s);
}
