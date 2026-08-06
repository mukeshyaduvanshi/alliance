import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  NegotiationStatus,
  OrderDto,
  OrderNegotiationDto,
  OrderStatus,
  Paginated,
  PurchaseOrderDto,
} from "@cj/types";

import { api } from "@/lib/api";

export function useOrders(
  filters?: { status?: string; brandId?: string; vendorId?: string },
  page = 1
) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.brandId) params.set("brandId", filters.brandId);
  if (filters?.vendorId) params.set("vendorId", filters.vendorId);
  params.set("page", String(page));
  params.set("pageSize", "20");
  const qs = params.toString();
  return useQuery({
    queryKey: ["orders", filters ?? {}, page],
    queryFn: () => api.get<Paginated<OrderDto>>(`/orders?${qs}`),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => api.get<OrderDto>(`/orders/${id}`),
    enabled: Boolean(id),
  });
}

export function useAssignVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, vendorId }: { orderId: string; vendorId: string }) =>
      api.post(`/orders/${orderId}/assign-vendor`, { vendorId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useOrderNegotiations(orderId: string) {
  return useQuery({
    queryKey: ["orders", orderId, "negotiations"],
    queryFn: () => api.get<OrderNegotiationDto[]>(`/orders/${orderId}/negotiations`),
    enabled: Boolean(orderId),
  });
}

export function useRespondNegotiation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      negotiationId,
      data,
    }: {
      negotiationId: string;
      data: { status: NegotiationStatus; responseRemarks?: string };
    }) => api.post(`/orders/negotiations/${negotiationId}/respond`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useBrandsForOrders() {
  return useQuery({
    queryKey: ["brands", "dropdown"],
    queryFn: () => api.get<Paginated<{ id: string; brandName: string }>>("/brands?page=1&pageSize=100"),
  });
}

export function useVendorsForOrders() {
  return useQuery({
    queryKey: ["vendors", "dropdown"],
    queryFn: () => api.get<Paginated<{ id: string; vendorName: string }>>("/vendors?page=1&pageSize=100"),
  });
}

export function usePurchaseOrders(brandId?: string, page = 1) {
  return useQuery({
    queryKey: ["purchase-orders", brandId ?? "all", page],
    queryFn: () =>
      api.get<Paginated<PurchaseOrderDto>>(
        brandId
          ? `/brands/${brandId}/purchase-orders?page=${page}&pageSize=${20}`
          : `/purchase-orders?page=${page}&pageSize=${20}`
      ),
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      brandId,
      data,
    }: {
      brandId: string;
      data: { poNumber: string; totalBudget: number };
    }) => api.post(`/brands/${brandId}/purchase-orders`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });
}

export function useTogglePoStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/purchase-orders/${id}/status`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });
}
