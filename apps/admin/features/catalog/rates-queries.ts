import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CreateRateDto, Paginated, RateDto, UpdateRateDto } from "@cj/types";

import { api } from "@/lib/api";

export function useRates(page = 1) {
  return useQuery({
    queryKey: ["rates", page],
    queryFn: () => api.get<Paginated<RateDto>>(`/rates?page=${page}&pageSize=${20}`),
  });
}

export function useCreateRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRateDto) => api.post<RateDto>("/rates", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rates"] });
    },
  });
}

export function useUpdateRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRateDto }) =>
      api.patch<RateDto>(`/rates/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rates"] });
    },
  });
}

export function useDeleteRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/rates/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rates"] });
    },
  });
}