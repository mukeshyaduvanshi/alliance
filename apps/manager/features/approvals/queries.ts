import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Paginated, WorkflowInstanceDto } from "@cj/types";

import { api } from "@/lib/api";

export function usePendingWorkflows(page = 1) {
  return useQuery({
    queryKey: ["workflow-instances", "pending", page],
    queryFn: () =>
      api.get<Paginated<WorkflowInstanceDto>>(
        `/workflow-instances/pending?page=${page}&pageSize=${20}`
      ),
  });
}

export function useWorkflowHistory(status?: string, page = 1) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("pageSize", "20");
  return useQuery({
    queryKey: ["workflow-instances", "history", status ?? "all", page],
    queryFn: () => api.get<Paginated<WorkflowInstanceDto>>(`/workflow-instances?${params.toString()}`),
  });
}

export function useApproveInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      api.post(`/workflow-instances/${id}/approve`, { remarks }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow-instances"] });
    },
  });
}

export function useRejectInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      api.post(`/workflow-instances/${id}/reject`, { remarks }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow-instances"] });
    },
  });
}

export function useEscalateInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      api.post(`/workflow-instances/${id}/escalate`, { remarks }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow-instances"] });
    },
  });
}
