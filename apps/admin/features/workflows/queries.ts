import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  ApprovalActionInput,
  CreateWorkflowModuleDto,
  CreateWorkflowRuleDto,
  Paginated,
  UpdateWorkflowRuleDto,
  WorkflowInstanceDto,
  WorkflowModuleDto,
  WorkflowRuleDto,
} from "@cj/types";

import { api } from "@/lib/api";

export function useWorkflows(page = 1) {
  return useQuery({
    queryKey: ["workflows", page],
    queryFn: () =>
      api.get<Paginated<WorkflowRuleDto>>(
        `/workflows?page=${page}&pageSize=${20}`,
      ),
  });
}

export function useWorkflowModules() {
  return useQuery({
    queryKey: ["workflow-modules"],
    queryFn: () => api.get<WorkflowModuleDto[]>("/workflows/modules/detail"),
  });
}

export function useCreateWorkflowModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorkflowModuleDto) =>
      api.post<WorkflowModuleDto>("/workflows/modules", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow-modules"] });
    },
  });
}

export function useUpdateWorkflowModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateWorkflowModuleDto }) =>
      api.patch<WorkflowModuleDto>(`/workflows/modules/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow-modules"] });
    },
  });
}

export function useDeleteWorkflowModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/workflows/modules/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow-modules"] });
    },
  });
}

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorkflowRuleDto) =>
      api.post<WorkflowRuleDto>("/workflows", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

export function useUpdateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkflowRuleDto }) =>
      api.patch<WorkflowRuleDto>(`/workflows/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/workflows/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

export function useAddWorkflowStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        stepOrder: number;
        approverRoleId: string;
        escalationRoleId?: string;
        isOptional?: boolean;
      };
    }) => api.post(`/workflows/${id}/steps`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

export function useWorkflowInstances(page = 1) {
  return useQuery({
    queryKey: ["workflow-instances", page],
    queryFn: () =>
      api.get<Paginated<WorkflowInstanceDto>>(
        `/workflow-instances?page=${page}&pageSize=${20}`,
      ),
  });
}

export function usePendingWorkflows() {
  return useQuery({
    queryKey: ["workflow-instances", "pending"],
    queryFn: () =>
      api.get<WorkflowInstanceDto[]>("/workflow-instances/pending"),
  });
}

export function useApproveInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      api.post(`/workflow-instances/${id}/approve`, {
        remarks,
      } as ApprovalActionInput),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow-instances"] });
    },
  });
}

export function useRejectInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      api.post(`/workflow-instances/${id}/reject`, {
        remarks,
      } as ApprovalActionInput),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow-instances"] });
    },
  });
}
