import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { OrderDto, Paginated, VendorDto } from "@cj/types";

import { api } from "@/lib/api";

export function useVendors(page = 1) {
  return useQuery({
    queryKey: ["vendors", "list", page],
    queryFn: () => api.get<Paginated<VendorDto>>(`/vendors?page=${page}&pageSize=${20}`),
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: ["vendors", id],
    queryFn: () => api.get<VendorDto>(`/vendors/${id}`),
    enabled: Boolean(id),
  });
}

export function useVendorOrders(vendorId: string, page = 1) {
  return useQuery({
    queryKey: ["orders", "vendor", vendorId, page],
    queryFn: () =>
      api.get<Paginated<OrderDto>>(`/orders?vendorId=${vendorId}&page=${page}&pageSize=${20}`),
    enabled: Boolean(vendorId),
  });
}

export function useApproveVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      api.post(`/vendors/${id}/approve`, { remarks }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors"] });
      qc.invalidateQueries({ queryKey: ["workflow-instances"] });
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
      qc.invalidateQueries({ queryKey: ["workflow-instances"] });
    },
  });
}
