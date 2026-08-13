"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  NotificationDto,
  Paginated,
  ProposeNegotiationInput,
  VendorDto,
  VendorOrderDto,
  VendorProductRateDto,
} from "@cj/types";

import { api } from "@/lib/api";

// ===== Vendor Profile =====

export function useVendorProfile() {
  return useQuery({
    queryKey: ["vendor", "profile"],
    queryFn: () => api.get<VendorDto>("/vendor-auth/me"),
  });
}

// ===== Orders =====

export function useVendorOrders(status?: string, page = 1) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("pageSize", "20");
  return useQuery({
    queryKey: ["vendor", "orders", status ?? "all", page],
    queryFn: () =>
      api.get<Paginated<VendorOrderDto>>(`/vendor/orders?${params.toString()}`),
  });
}

export function useVendorOrder(id: string) {
  return useQuery({
    queryKey: ["vendor", "orders", "detail", id],
    queryFn: () => api.get<VendorOrderDto>(`/vendor/orders/${id}`),
    enabled: !!id,
  });
}

export function useProposeNegotiation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: ProposeNegotiationInput }) =>
      api.post(`/vendor/orders/${orderId}/negotiate`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor", "orders"] });
    },
  });
}

// ===== Rate Card =====

export function useVendorProducts(page = 1) {
  return useQuery({
    queryKey: ["vendor", "products", "browse", page],
    queryFn: () =>
      api.get<Paginated<Record<string, unknown>>>(
        `/vendor/products?page=${page}&pageSize=${20}`
      ),
  });
}

export function useVendorMyRates(page = 1) {
  return useQuery({
    queryKey: ["vendor", "products", "my-rates", page],
    queryFn: () =>
      api.get<Paginated<VendorProductRateDto>>(
        `/vendor/products/my-rates?page=${page}&pageSize=${20}`
      ),
  });
}

export function useSelectRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { productId: string; region: string }) =>
      api.post("/vendor/products/select-rate", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor", "products"] });
    },
  });
}

export function useSetVendorRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: unknown }) =>
      api.patch(`/vendor/products/${productId}/rate`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor", "products"] });
    },
  });
}

// ===== Notifications =====

export function useVendorNotifications(isRead?: boolean, page = 1) {
  const params = new URLSearchParams();
  if (isRead !== undefined) params.set("isRead", String(isRead));
  params.set("page", String(page));
  params.set("pageSize", "20");
  return useQuery({
    queryKey: ["vendor", "notifications", isRead === undefined ? "all" : isRead, page],
    queryFn: () =>
      api.get<Paginated<NotificationDto>>(`/vendor/notifications?${params.toString()}`),
  });
}

export function useVendorUnreadCount() {
  return useQuery({
    queryKey: ["vendor", "notifications", "unread-count"],
    queryFn: () =>
      api.get<{ unreadCount: number }>("/vendor/notifications/unread-count"),
  });
}

export function useMarkVendorNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/vendor/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor", "notifications"] });
    },
  });
}

export function useMarkAllVendorNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch("/vendor/notifications/read-all"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor", "notifications"] });
    },
  });
}

// ===== Dashboard KPIs =====

export function useVendorDashboardKpis() {
  const profile = useVendorProfile();
  const orders = useVendorOrders(undefined, 1);

  const all = orders.data?.data ?? [];
  const kpis = {
    assigned: all.filter((o) => o.status === "VENDOR_ASSIGNED").length,
    inProduction: all.filter((o) => o.status === "IN_PRODUCTION").length,
    completed: all.filter((o) =>
      ["INSTALLATION_COMPLETE", "PAYMENT_PENDING", "PAYMENT_RECEIVED"].includes(o.status)
    ).length,
    pendingNegotiations: all.filter((o) =>
      (o.negotiations ?? []).some((n) => n.status === "PENDING")
    ).length,
    totalOrders: orders.data?.meta.total ?? 0,
  };

  return { profile, orders, kpis };
}
