import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  CreateUserDto,
  Paginated,
  RoleDto,
  UpdateUserDto,
  UserDto,
} from "@cj/types";

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

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      api.patch<UserDto>(`/users/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useResetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      api.post(`/users/${id}/reset-password`, { newPassword }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
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
