import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  BackupLogDto,
  EmailLogDto,
  ErrorLogDto,
  LicenseDto,
  QueueJobDto,
  QueueJobStatus,
  QueueOverviewDto,
  SmsLogDto,
  SubscriptionPlanDto,
} from "@cj/types";

import { api } from "@/lib/api";

export interface SystemHealthDto {
  database: string;
  redis: string;
  uptimeSeconds: number;
  checkedInMs: number;
  timestamp: string;
}

export interface QueueJobsResponse {
  data: QueueJobDto[];
  total: number;
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ["system", "health"],
    queryFn: () => api.get<SystemHealthDto>("/system/health"),
    refetchInterval: 15_000,
  });
}

export function useErrorLogs(level?: string) {
  const params = new URLSearchParams();
  if (level) params.set("level", level);
  const qs = params.toString();
  return useQuery({
    queryKey: ["system", "error-logs", level ?? "all"],
    queryFn: () => api.get<ErrorLogDto[]>(`/system/error-logs${qs ? `?${qs}` : ""}`),
  });
}

export function useCacheKeys(pattern = "*") {
  return useQuery({
    queryKey: ["system", "cache-keys", pattern],
    queryFn: () => api.get<string[]>(`/system/cache/keys?pattern=${encodeURIComponent(pattern)}`),
  });
}

export function useDeleteCacheKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => api.delete(`/system/cache/${encodeURIComponent(key)}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system", "cache-keys"] });
    },
  });
}

export function useFlushCache() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete("/system/cache"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system", "cache-keys"] });
    },
  });
}

export function useBackups() {
  return useQuery({
    queryKey: ["system", "backups"],
    queryFn: () => api.get<BackupLogDto[]>("/system/backups"),
  });
}

export function useLogBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { status: string; fileSizeMb?: number; errorMessage?: string }) =>
      api.post("/system/backups", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system", "backups"] });
      qc.invalidateQueries({ queryKey: ["system", "queues"] });
    },
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ["system", "plans"],
    queryFn: () => api.get<SubscriptionPlanDto[]>("/system/subscription-plans"),
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      maxUsers: number;
      maxBrands: number;
      maxVendors: number;
      priceMonthly: number;
    }) => api.post("/system/subscription-plans", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system", "plans"] });
    },
  });
}

export function useLicense() {
  return useQuery({
    queryKey: ["system", "license"],
    queryFn: () => api.get<LicenseDto>("/system/licenses"),
    retry: false,
  });
}

export function useCreateLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { planId: string; startDate: string; expiryDate: string }) =>
      api.post("/system/licenses", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system", "license"] });
    },
  });
}

export function useEmailLogs() {
  return useQuery({
    queryKey: ["system", "email-logs"],
    queryFn: () => api.get<EmailLogDto[]>("/system/email-logs"),
  });
}

export function useSmsLogs() {
  return useQuery({
    queryKey: ["system", "sms-logs"],
    queryFn: () => api.get<SmsLogDto[]>("/system/sms-logs"),
  });
}

export function useQueues() {
  return useQuery({
    queryKey: ["system", "queues"],
    queryFn: () => api.get<QueueOverviewDto[]>("/system/queues"),
    refetchInterval: 15_000,
  });
}

export function useQueueJobs(name: string, status?: QueueJobStatus, page = 1) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("pageSize", "20");
  return useQuery({
    queryKey: ["system", "queues", name, status ?? "all", page],
    queryFn: () =>
      api.get<QueueJobsResponse>(`/system/queues/${name}/jobs?${params.toString()}`),
    enabled: Boolean(name),
  });
}

export function useRetryJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, id }: { name: string; id: string }) =>
      api.post(`/system/queues/${name}/jobs/${id}/retry`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system", "queues"] });
    },
  });
}

export function useRemoveJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, id }: { name: string; id: string }) =>
      api.delete(`/system/queues/${name}/jobs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system", "queues"] });
    },
  });
}
