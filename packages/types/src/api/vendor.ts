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

export interface VendorProductRateDto {
  id: string;
  vendorId: string;
  productId: string;
  region: Region;
  isActive: boolean;
  name?: string;
  unit?: string;
  rate?: string | null;
  category?: { id: string; name: string } | null;
  vendorRegionRates?: { region: Region; rate: string }[];
}

export interface VendorOrderItemDto {
  id: string;
  productId: string;
  region: Region;
  quantity: string;
  rateSnapshot: string;
  amount: string;
  vendorRateSnapshot?: string | null;
  vendorAmount?: string | null;
  product?: { id: string; name: string; unit: string };
}

export interface VendorOrderArtworkDto {
  id: string;
  fileUrl: string;
  fileName: string;
  type: string;
  version: number;
  uploadedAt: string;
}

export interface VendorOrderNegotiationDto {
  id: string;
  proposedAmount: string;
  remarks?: string | null;
  status: NegotiationStatus;
  responseRemarks?: string | null;
  createdAt: string;
}

export interface VendorOrderDto {
  id: string;
  tenantId: string;
  brandId: string;
  vendorId?: string | null;
  poId?: string | null;
  orderNumber: string;
  status: string;
  siteLocation: string;
  totalAmount: string;
  vendorTotalAmount?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: VendorOrderItemDto[];
  artworks?: VendorOrderArtworkDto[];
  negotiations?: VendorOrderNegotiationDto[];
}

export interface ProposeNegotiationInput {
  proposedAmount: number;
  remarks?: string;
}

export interface AdminVendorRateDto {
  id: string;
  productId: string;
  productName: string;
  category: string | null;
  region: Region;
  rate: string | null;
  updatedAt: string;
}

export interface AssignVendorRateInput {
  productId: string;
  region: Region;
  rate: number;
}
