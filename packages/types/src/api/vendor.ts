import {
  BusinessType,
  NegotiationStatus,
  Region,
  VendorApprovalStatus,
} from "../enums";
import { BusinessProfileDto } from "./brand";

export interface VendorDto {
  id: string;
  tenantId: string;
  businessProfileId?: string | null;
  vendorName: string;
  contactPersonName?: string | null;
  email?: string | null;
  phone?: string | null;
  approvalStatus: VendorApprovalStatus;
  isActive: boolean;
  createdAt: string;
  businessProfile?: BusinessProfileDto;
}

export interface RegisterVendorDto {
  vendorName: string;
  contactPersonName?: string;
  email: string;
  phone: string;
  password: string;
  legalName: string;
  businessType: BusinessType;
  panNumber?: string;
  gstNumber?: string;
  msmeNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

export interface VendorRateDto {
  id: string;
  vendorId: string;
  productId: string;
  region: Region;
  isActive: boolean;
  product?: { id: string; name: string; unit: string };
}

export interface SelectRateDto {
  productId: string;
  region: Region;
}

export interface NegotiationResponseDto {
  id: string;
  orderId: string;
  vendorId: string;
  proposedAmount: string;
  remarks?: string | null;
  status: NegotiationStatus;
  responseRemarks?: string | null;
}
