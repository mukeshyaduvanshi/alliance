import { useQuery } from "@tanstack/react-query";

import type { AuditLogPage, AuditLogQuery } from "@cj/types";

import { api } from "@/lib/api";

export function useAuditLogs(query: AuditLogQuery) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  if (query.module) params.set("module", query.module);
  if (query.action) params.set("action", query.action);
  if (query.actorType) params.set("actorType", query.actorType);
  if (query.actorId) params.set("actorId", query.actorId);
  if (query.fromDate) params.set("fromDate", query.fromDate);
  if (query.toDate) params.set("toDate", query.toDate);
  if (query.search) params.set("search", query.search);

  return useQuery({
    queryKey: ["audit-logs", query],
    queryFn: () => api.get<AuditLogPage>(`/audit-logs?${params.toString()}`),
  });
}

export function auditLogExportUrl(query: AuditLogQuery): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
  const params = new URLSearchParams();
  if (query.module) params.set("module", query.module);
  if (query.action) params.set("action", query.action);
  if (query.actorType) params.set("actorType", query.actorType);
  if (query.fromDate) params.set("fromDate", query.fromDate);
  if (query.toDate) params.set("toDate", query.toDate);
  if (query.search) params.set("search", query.search);
  const qs = params.toString();
  return `${base}/audit-logs/export${qs ? `?${qs}` : ""}`;
}
