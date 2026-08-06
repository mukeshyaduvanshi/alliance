import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  AssignPermissionsDto,
  CreateRoleDto,
  Paginated,
  PermissionDto,
  RoleDto,
  UpdateRoleDto,
} from "@cj/types";

import { api } from "@/lib/api";

export const ROLES_PAGE_SIZE = 20;

export type PermissionMap = Record<string, PermissionDto[]>;

export function useRoles(page = 1) {
  return useQuery({
    queryKey: ["roles", page],
    queryFn: () =>
      api.get<Paginated<RoleDto>>(`/roles?page=${page}&pageSize=${100}`),
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: ["roles", id],
    queryFn: () => api.get<RoleDto>(`/roles/${id}`),
    enabled: Boolean(id),
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: () => api.get<PermissionMap>("/permissions"),
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoleDto) => api.post<RoleDto>("/roles", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleDto }) =>
      api.patch<RoleDto>(`/roles/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useCloneRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.post<RoleDto>(`/roles/${id}/clone`, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useToggleRoleStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "INACTIVE" }) =>
      api.patch(`/roles/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useAssignPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: AssignPermissionsDto;
    }) => api.patch(`/roles/${id}/permissions`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}
