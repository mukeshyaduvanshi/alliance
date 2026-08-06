import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  CreateSlaRuleDto,
  ExceptionAlertDto,
  Paginated,
  SlaRuleDto,
} from "@cj/types";

import { api } from "@/lib/api";

export function useSlaRules(page = 1) {
  return useQuery({
    queryKey: ["sla-rules", page],
    queryFn: () =>
      api.get<Paginated<SlaRuleDto>>(`/sla-rules?page=${page}&pageSize=${20}`),
  });
}

export function useCreateSlaRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSlaRuleDto) => api.post<SlaRuleDto>("/sla-rules", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sla-rules"] });
    },
  });
}

export function useAlerts(isResolved?: boolean, page = 1) {
  const params = new URLSearchParams();
  if (isResolved !== undefined) params.set("isResolved", String(isResolved));
  params.set("page", String(page));
  params.set("pageSize", "20");
  return useQuery({
    queryKey: ["alerts", isResolved === undefined ? "all" : isResolved ? "resolved" : "open", page],
    queryFn: () => api.get<Paginated<ExceptionAlertDto>>(`/alerts?${params.toString()}`),
  });
}

export function useResolveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/alerts/${id}/resolve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
