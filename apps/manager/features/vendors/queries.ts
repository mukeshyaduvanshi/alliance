import { useQuery } from "@tanstack/react-query";

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
