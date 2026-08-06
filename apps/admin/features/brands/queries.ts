import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  BrandBusinessModelConfigDto,
  BrandDto,
  BusinessModelType,
  Paginated,
  UserDto,
} from "@cj/types";

import { api } from "@/lib/api";

export function useBrands(status?: string, page = 1) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("pageSize", "20");
  return useQuery({
    queryKey: ["brands", status ?? "all", page],
    queryFn: () => api.get<Paginated<BrandDto>>(`/brands?${params.toString()}`),
  });
}

export function useBrand(id: string) {
  return useQuery({
    queryKey: ["brands", id],
    queryFn: () => api.get<BrandDto>(`/brands/${id}`),
    enabled: Boolean(id),
  });
}

export function useApproveBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      api.post(`/brands/${id}/approve`, { remarks }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}

export function useRejectBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      api.post(`/brands/${id}/reject`, { remarks }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}

export function useToggleBrandStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/brands/${id}/status`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}

export function useBrandBusinessModel(brandId: string) {
  return useQuery({
    queryKey: ["brands", brandId, "business-model"],
    queryFn: () =>
      api.get<BrandBusinessModelConfigDto>(`/brands/${brandId}/business-model`),
    enabled: Boolean(brandId),
  });
}

export function useSetBusinessModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      brandId,
      data,
    }: {
      brandId: string;
      data: {
        businessModel: BusinessModelType;
        commissionPercent?: number;
        markupPercent?: number;
      };
    }) => api.post(`/brands/${brandId}/business-model`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}

export function useAssignKam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ brandId, kamUserId }: { brandId: string; kamUserId: string }) =>
      api.patch(`/brands/${brandId}/assign-kam`, { kamUserId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}

export function useInternalUsers() {
  return useQuery({
    queryKey: ["users", "all"],
    queryFn: () => api.get<Paginated<UserDto>>("/users?page=1&pageSize=100"),
  });
}
