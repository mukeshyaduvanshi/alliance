import { useQuery } from "@tanstack/react-query";

import type { ExceptionAlertDto, OrderDto, Paginated } from "@cj/types";

import { api } from "@/lib/api";

export interface KamDashboardData {
  totalBrands: number;
  brands: { id: string; brandName: string; approvalStatus: string }[];
  pendingOrders: number;
  activeAlerts: number;
  recentOrders: OrderDto[];
}

export interface SlaBreachItem {
  order: OrderDto;
  rule: { id: string; name: string; appliesToStatus: string; thresholdHours: number };
}

export function useKamDashboard() {
  return useQuery({
    queryKey: ["dashboard", "kam"],
    queryFn: () => api.get<KamDashboardData>("/dashboard/kam"),
  });
}

export function useSlaStatus() {
  return useQuery({
    queryKey: ["dashboard", "sla-status"],
    queryFn: () => api.get<SlaBreachItem[]>("/dashboard/sla-status"),
  });
}

export function useOpenAlerts() {
  return useQuery({
    queryKey: ["alerts", "open"],
    queryFn: () =>
      api.get<Paginated<ExceptionAlertDto>>(`/alerts?isResolved=false&page=1&pageSize=${10}`),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => api.get<{ unreadCount: number }>("/notifications/unread-count"),
  });
}
