import { useQueries, useQuery } from "@tanstack/react-query";

import type {
  BrandDto,
  ExceptionAlertDto,
  OrderDto,
  Paginated,
  UserDto,
  VendorDto,
} from "@cj/types";

import { api } from "@/lib/api";

export interface DashboardKpis {
  totalUsers: number;
  totalBrands: number;
  totalVendors: number;
  totalOrders: number;
  pendingBrands: number;
  pendingVendors: number;
}

export function useDashboardKpis() {
  const results = useQueries({
    queries: [
      {
        queryKey: ["users", "kpi"],
        queryFn: () =>
          api.get<Paginated<UserDto>>("/users?page=1&pageSize=20"),
      },
      {
        queryKey: ["brands", "kpi"],
        queryFn: () =>
          api.get<Paginated<BrandDto>>("/brands?page=1&pageSize=20"),
      },
      {
        queryKey: ["brands", "kpi", "PENDING"],
        queryFn: () =>
          api.get<Paginated<BrandDto>>("/brands?status=PENDING&page=1&pageSize=20"),
      },
      {
        queryKey: ["vendors", "kpi"],
        queryFn: () =>
          api.get<Paginated<VendorDto>>("/vendors?page=1&pageSize=20"),
      },
      {
        queryKey: ["vendors", "kpi", "PENDING"],
        queryFn: () =>
          api.get<Paginated<VendorDto>>("/vendors?status=PENDING&page=1&pageSize=20"),
      },
      {
        queryKey: ["orders", "kpi"],
        queryFn: () =>
          api.get<Paginated<OrderDto>>("/orders?page=1&pageSize=20"),
      },
    ],
  });

  const [users, brands, pendingBrands, vendors, pendingVendors, orders] =
    results;

  const kpis: DashboardKpis = {
    totalUsers: users.data?.meta.total ?? 0,
    totalBrands: brands.data?.meta.total ?? 0,
    totalVendors: vendors.data?.meta.total ?? 0,
    totalOrders: orders.data?.meta.total ?? 0,
    pendingBrands: pendingBrands.data?.meta.total ?? 0,
    pendingVendors: pendingVendors.data?.meta.total ?? 0,
  };

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);

  return { kpis, isLoading, isError };
}

export function useBreachedOrders() {
  return useQuery({
    queryKey: ["dashboard", "sla-status"],
    queryFn: () => api.get<unknown[]>("/dashboard/sla-status"),
  });
}

export function useOpenAlerts() {
  return useQuery({
    queryKey: ["alerts", "open"],
    queryFn: () =>
      api.get<Paginated<ExceptionAlertDto>>("/alerts?isResolved=false&page=1&pageSize=10"),
  });
}

export function useOrderStatusBreakdown() {
  return useQuery({
    queryKey: ["orders", "breakdown"],
    queryFn: () =>
      api.get<Paginated<OrderDto>>("/orders?page=1&pageSize=100"),
  });
}
