import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  AdminVendorRateDto,
  AssignVendorRateInput,
  BusinessModelType,
  Paginated,
  ProductDto,
  VendorBusinessModelConfigDto,
  VendorDto,
  VendorManagerDto,
} from "@cj/types";

import { api } from "@/lib/api";

export function useVendors(status?: string, page = 1) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("pageSize", "20");
  return useQuery({
    queryKey: ["vendors", status ?? "all", page],
    queryFn: () => api.get<Paginated<VendorDto>>(`/vendors?${params.toString()}`),
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: ["vendors", id],
    queryFn: () => api.get<VendorDto>(`/vendors/${id}`),
    enabled: Boolean(id),
  });
}

export function useApproveVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      api.post(`/vendors/${id}/approve`, { remarks }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}

export function useRejectVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      api.post(`/vendors/${id}/reject`, { remarks }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}

export function useToggleVendorStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/vendors/${id}/status`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}

export function useVendorRates(vendorId: string) {
  return useQuery({
    queryKey: ["vendors", vendorId, "rates"],
    queryFn: () => api.get<AdminVendorRateDto[]>(`/vendors/${vendorId}/rates`),
    enabled: Boolean(vendorId),
  });
}

export function useAssignVendorRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      vendorId,
      data,
    }: {
      vendorId: string;
      data: AssignVendorRateInput;
    }) => api.post(`/vendors/${vendorId}/rates`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}

export function useProductsForRates() {
  return useQuery({
    queryKey: ["products", "dropdown"],
    queryFn: () => api.get<Paginated<ProductDto>>(`/products?page=1&pageSize=100`),
  });
}

export function useVendorBusinessModel(vendorId: string) {
  return useQuery({
    queryKey: ["vendors", vendorId, "business-model"],
    queryFn: () =>
      api.get<VendorBusinessModelConfigDto>(`/vendors/${vendorId}/business-model`),
    enabled: Boolean(vendorId),
  });
}

export function useSetVendorBusinessModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      vendorId,
      data,
    }: {
      vendorId: string;
      data: {
        businessModel: BusinessModelType;
        commissionPercent?: number;
        markupPercent?: number;
      };
    }) => api.post(`/vendors/${vendorId}/business-model`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}

export function useVendorManagers(vendorId: string) {
  return useQuery({
    queryKey: ["vendors", vendorId, "managers"],
    queryFn: () => api.get<VendorManagerDto[]>(`/vendors/${vendorId}/managers`),
    enabled: Boolean(vendorId),
  });
}

export function useAssignVendorManagers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, userIds }: { vendorId: string; userIds: string[] }) =>
      api.post(`/vendors/${vendorId}/managers`, { userIds }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["vendors", variables.vendorId, "managers"] });
      qc.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}

export function useRemoveVendorManager() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, userId }: { vendorId: string; userId: string }) =>
      api.delete(`/vendors/${vendorId}/managers/${userId}`),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["vendors", variables.vendorId, "managers"] });
      qc.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}
