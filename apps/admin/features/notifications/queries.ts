import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { NotificationDto, Paginated } from "@cj/types";

import { api } from "@/lib/api";

export function useNotifications(isRead?: boolean, page = 1) {
  const params = new URLSearchParams();
  if (isRead !== undefined) params.set("isRead", String(isRead));
  params.set("page", String(page));
  params.set("pageSize", "20");
  return useQuery({
    queryKey: ["notifications", isRead === undefined ? "all" : isRead ? "read" : "unread", page],
    queryFn: () => api.get<Paginated<NotificationDto>>(`/notifications?${params.toString()}`),
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
