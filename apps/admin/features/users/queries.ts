import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CreateUserDto, Paginated, RoleDto, UserDto } from "@cj/types";

import { api } from "@/lib/api";

export const USERS_PAGE_SIZE = 20;

export function useUsers(page = 1) {
  return useQuery({
    queryKey: ["users", page],
    queryFn: () =>
      api.get<Paginated<UserDto>>(`/users?page=${page}&pageSize=${USERS_PAGE_SIZE}`),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserDto) => api.post<UserDto>("/users", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}

export function useRoles(page = 1) {
  return useQuery({
    queryKey: ["roles", page],
    queryFn: () =>
      api.get<Paginated<RoleDto>>(`/roles?page=${page}&pageSize=${100}`),
  });
}
