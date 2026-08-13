import {
  BrandApprovalStatus,
  BusinessModelType,
  BusinessType,
  Region,
} from "../enums";

export interface BusinessProfileDto {
  id: string;
  legalName: string;
  businessType: BusinessType;
  panNumber?: string | null;
  gstNumber?: string | null;
  msmeNumber?: string | null;
  cinNumber?: string | null;
  panDocUrl?: string | null;
  gstDocUrl?: string | null;
  msmeDocUrl?: string | null;
  cinDocUrl?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isVerified: boolean;
}

export interface BrandDto {
  id: string;
  tenantId: string;
  businessProfileId: string;
  brandName: string;
  contactPersonName: string;
  email: string;
  phone: string;
  logoUrl?: string | null;
  approvalStatus: BrandApprovalStatus;
  isActive: boolean;
  createdAt: string;
  assignedKamId?: string | null;
  businessProfile?: BusinessProfileDto;
  assignedKam?: { id: string; fullName: string };
}

export interface BrandManagerDto {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role?: { id: string; name: string };
  assignedAt: string;
}

export interface RegisterBrandDto {
  brandName: string;
  contactPersonName: string;
  email: string;
  phone: string;
  password: string;
  legalName: string;
  businessType: BusinessType;
  panNumber?: string;
  gstNumber?: string;
  msmeNumber?: string;
  cinNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

export interface BrandBusinessModelConfigDto {
  id: string;
  brandId: string;
  businessModel: BusinessModelType;
  commissionPercent?: string | null;
  markupPercent?: string | null;
  effectiveFrom: string;
}

export interface UpdateBrandBusinessProfileDto {
  legalName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface UpdateBrandProfileDto {
  brandName?: string;
  contactPersonName?: string;
  phone?: string;
  businessProfile?: UpdateBrandBusinessProfileDto;
}

export interface BrandLoginResponse {
  accessToken: string;
  brand: BrandDto;
}

export interface BrandRateDto {
  id: string;
  brandId: string;
  productId: string;
  region: Region;
  isCustomRate: boolean;
  customRate?: string | null;
  isActive: boolean;
  product?: { id: string; name: string; unit: string };
}

export interface SetBrandRateDto {
  region: Region;
  isCustomRate?: boolean;
  customRate?: number;
}
