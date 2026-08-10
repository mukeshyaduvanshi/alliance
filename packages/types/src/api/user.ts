import { UserStatus } from "../enums";

export interface UserDto {
  id: string;
  tenantId: string;
  roleId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  status: UserStatus;
  isAdmin: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  role?: { id: string; name: string };
}

export interface CreateUserDto {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  roleId: string;
  status?: UserStatus;
}

export interface UpdateUserDto {
  fullName?: string;
  phone?: string;
  roleId?: string;
  status?: UserStatus;
}

export interface ResetPasswordDto {
  newPassword: string;
}
