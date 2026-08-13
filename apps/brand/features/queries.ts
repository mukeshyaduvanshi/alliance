"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  BrandDto,
  CreateInvoiceDto,
  CreateOrderDto,
  InvoiceDto,
  NotificationDto,
  OrderDto,
  Paginated,
  PurchaseOrderDto,
  UpdateBrandProfileDto,
} from "@cj/types";

import { api } from "@/lib/api";

const BRAND_ORDER_KEYS = {
  all: ["brand", "orders"] as const,
  list: (page: number) => ["brand", "orders", "list", page] as const,
  detail: (id: string) => ["brand", "orders", "detail", id] as const,
};

// ===== Brand Profile =====

export function useBrandProfile() {
  return useQuery({
    queryKey: ["brand", "profile"],
    queryFn: () => api.get<BrandDto>("/brand-auth/me"),
  });
}

export function useUpdateBrandProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateBrandProfileDto) =>
      api.patch<BrandDto>("/brand-auth/me", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand", "profile"] });
    },
  });
}

// ===== Rate Card =====

export function useBrandProducts(page = 1) {
  return useQuery({
    queryKey: ["brand", "products", page],
    queryFn: () =>
      api.get<Paginated<Record<string, unknown>>>(
        `/brand/products?page=${page}&pageSize=${20}`
      ),
  });
}

export function useBrandProduct(id: string) {
  return useQuery({
    queryKey: ["brand", "products", "detail", id],
    queryFn: () => api.get<Record<string, unknown>>(`/brand/products/${id}`),
    enabled: !!id,
  });
}

export function useSetBrandRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: unknown }) =>
      api.patch(`/brand/products/${productId}/rate`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand", "products"] });
    },
  });
}

// ===== Orders =====

export function useBrandOrders(status?: string, page = 1) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("pageSize", "20");
  return useQuery({
    queryKey: ["brand", "orders", status ?? "all", page],
    queryFn: () => api.get<Paginated<OrderDto>>(`/brand/orders?${params.toString()}`),
  });
}

export function useBrandOrder(id: string) {
  return useQuery({
    queryKey: ["brand", "orders", "detail", id],
    queryFn: () => api.get<OrderDto>(`/brand/orders/${id}`),
    enabled: !!id,
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CreateOrderDto, "brandId">) =>
      api.post<OrderDto>("/brand/orders", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand", "orders"] });
      qc.invalidateQueries({ queryKey: ["brand", "purchase-orders"] });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/brand/orders/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand", "orders"] });
    },
  });
}

// ===== Artwork =====

export function useApproveArtwork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/brand/orders/${id}/approve-artwork`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand", "orders"] });
    },
  });
}

export function useRejectArtwork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/brand/orders/${id}/reject-artwork`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand", "orders"] });
    },
  });
}

// ===== Purchase Orders =====

export function useBrandPurchaseOrders(page = 1) {
  return useQuery({
    queryKey: ["brand", "purchase-orders", page],
    queryFn: () =>
      api.get<Paginated<PurchaseOrderDto>>(
        `/brand/purchase-orders?page=${page}&pageSize=${20}`
      ),
  });
}

export function useDashboardKpis() {
  const profile = useBrandProfile();
  const orders = useBrandOrders(undefined, 1);
  const pos = useBrandPurchaseOrders(1);

  const totalOrders = orders.data?.meta.total ?? 0;
  const pendingArtwork =
    orders.data?.data.filter((o) => o.status === "PENDING_BRAND_APPROVAL").length ??
    0;
  const totalPoBudget = pos.data?.data.reduce(
    (sum, po) => sum + Number(po.totalBudget),
    0
  ) ?? 0;
  const totalPoConsumed = pos.data?.data.reduce(
    (sum, po) => sum + Number(po.consumedAmount),
    0
  ) ?? 0;

  return {
    profile,
    orders,
    pos,
    kpis: {
      totalOrders,
      pendingArtwork,
      totalPoBudget,
      totalPoConsumed,
    },
  };
}

// ===== Invoices =====

export function useBrandInvoices(page = 1) {
  return useQuery({
    queryKey: ["brand", "invoices", page],
    queryFn: () =>
      api.get<Paginated<InvoiceDto>>(`/brand/invoices?page=${page}&pageSize=${20}`),
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoiceDto) =>
      api.post<InvoiceDto>("/brand/invoices", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand", "invoices"] });
    },
  });
}

// ===== Notifications =====

export function useBrandNotifications(isRead?: boolean, page = 1) {
  const params = new URLSearchParams();
  if (isRead !== undefined) params.set("isRead", String(isRead));
  params.set("page", String(page));
  params.set("pageSize", "20");
  return useQuery({
    queryKey: ["brand", "notifications", isRead === undefined ? "all" : isRead, page],
    queryFn: () =>
      api.get<Paginated<NotificationDto>>(`/brand/notifications?${params.toString()}`),
  });
}

export function useBrandUnreadCount() {
  return useQuery({
    queryKey: ["brand", "notifications", "unread-count"],
    queryFn: () => api.get<{ unreadCount: number }>("/brand/notifications/unread-count"),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/brand/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand", "notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch("/brand/notifications/read-all"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand", "notifications"] });
    },
  });
}
