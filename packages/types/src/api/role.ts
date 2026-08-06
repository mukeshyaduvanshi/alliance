import { PermissionAction, RoleStatus } from "../enums";

export interface RoleDto {
  id: string;
  tenantId: string;
  parentRoleId?: string | null;
  name: string;
  description?: string | null;
  department?: string | null;
  status: RoleStatus;
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
  parentRole?: { id: string; name: string };
  rolePermissions?: {
    id: string;
    permissionId: string;
    permission: PermissionDto;
  }[];
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  department?: string;
  parentRoleId?: string;
  status?: RoleStatus;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  department?: string;
  parentRoleId?: string;
  status?: RoleStatus;
}

export interface CloneRoleDto {
  name: string;
  description?: string;
}

export interface PermissionDto {
  id: string;
  module: string;
  action: PermissionAction;
  label: string;
}

export interface AssignPermissionsDto {
  permissionIds: string[];
}

export interface RolePermissionMatrix {
  roleId: string;
  roleName: string;
  permissions: Record<string, PermissionAction[]>;
}
