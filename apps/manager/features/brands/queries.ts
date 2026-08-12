import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  BrandBusinessModelConfigDto,
  BrandDto,
  OrderDto,
  Paginated,
  PurchaseOrderDto,
} from "@cj/types";

import { api } from "@/lib/api";

import type { KamDashboardData } from "@/features/dashboard/queries";

export function useKamBrands() {
  return useQuery({
    queryKey: ["dashboard", "kam"],
    queryFn: () => api.get<KamDashboardData>("/dashboard/kam"),
  });
}

export function useBrand(id: string) {
  return useQuery({
    queryKey: ["brands", id],
    queryFn: () => api.get<BrandDto>(`/brands/${id}`),
    enabled: Boolean(id),
  });
}

export function useBrandBusinessModel(brandId: string) {
  return useQuery({
    queryKey: ["brands", brandId, "business-model"],
    queryFn: () => api.get<BrandBusinessModelConfigDto>(`/brands/${brandId}/business-model`),
    enabled: Boolean(brandId),
  });
}

export function useBrandPurchaseOrders(brandId: string, page = 1) {
  return useQuery({
    queryKey: ["brands", brandId, "purchase-orders", page],
    queryFn: () =>
      api.get<Paginated<PurchaseOrderDto>>(
        `/brands/${brandId}/purchase-orders?page=${page}&pageSize=${20}`
      ),
    enabled: Boolean(brandId),
  });
}

export function useBrandOrders(brandId: string, page = 1) {
  return useQuery({
    queryKey: ["orders", "brand", brandId, page],
    queryFn: () =>
      api.get<Paginated<OrderDto>>(`/orders?brandId=${brandId}&page=${page}&pageSize=${20}`),
    enabled: Boolean(brandId),
  });
}

export function useApproveBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      api.post(`/brands/${id}/approve`, { remarks }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "kam"] });
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
      qc.invalidateQueries({ queryKey: ["dashboard", "kam"] });
    },
  });
}
