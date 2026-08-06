export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    roleId?: string;
    roleName?: string;
    tenantId?: string;
    isSuperAdmin?: boolean;
    brandId?: string;
    vendorId?: string;
  };
  permissions?: { module: string; action: string }[];
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshResponse {
  accessToken: string;
}
