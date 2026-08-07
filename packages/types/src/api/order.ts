import {
  ArtworkFileType,
  ArtworkSubmissionType,
  NegotiationStatus,
  OrderStatus,
  Region,
} from "../enums";

export interface OrderItemDto {
  id: string;
  orderId: string;
  productId: string;
  region: Region;
  quantity: string;
  rateSnapshot: string;
  amount: string;
  vendorRateSnapshot?: string | null;
  vendorAmount?: string | null;
  product?: { id: string; name: string; unit: string };
}

export interface OrderArtworkDto {
  id: string;
  orderId: string;
  type: ArtworkFileType;
  fileUrl: string;
  fileName: string;
  version: number;
  uploadedByUserId?: string | null;
  uploadedAt: string;
}

export interface OrderDto {
  id: string;
  tenantId: string;
  brandId: string;
  poId?: string | null;
  vendorId?: string | null;
  orderNumber: string;
  status: OrderStatus;
  artworkSubmissionType: ArtworkSubmissionType;
  siteLocation: string;
  totalAmount: string;
  vendorTotalAmount?: string | null;
  createdAt: string;
  updatedAt: string;
  brand?: { id: string; brandName: string };
  vendor?: { id: string; vendorName: string };
  items?: OrderItemDto[];
  artworks?: OrderArtworkDto[];
}

export interface CreateOrderDto {
  brandId?: string;
  poId?: string;
  artworkSubmissionType: ArtworkSubmissionType;
  siteLocation: string;
  artworkFileUrl: string;
  artworkFileName: string;
  items: {
    productId: string;
    region?: Region;
    quantity: number;
  }[];
}

export interface OrderNegotiationDto {
  id: string;
  tenantId: string;
  orderId: string;
  vendorId: string;
  proposedAmount: string;
  remarks?: string | null;
  status: NegotiationStatus;
  respondedById?: string | null;
  responseRemarks?: string | null;
  createdAt: string;
  respondedAt?: string | null;
  vendor?: { id: string; vendorName: string };
}

export interface PurchaseOrderDto {
  id: string;
  tenantId: string;
  brandId: string;
  poNumber: string;
  totalBudget: string;
  consumedAmount: string;
  isActive: boolean;
  createdAt: string;
  brand?: { id: string; brandName: string };
}
