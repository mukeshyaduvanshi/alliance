import { InvoiceStatus } from "../enums";

export interface InvoiceDto {
  id: string;
  tenantId: string;
  brandId: string;
  poId?: string | null;
  invoiceNumber: string;
  amount: string;
  status: InvoiceStatus;
  fileUrl?: string | null;
  fileName?: string | null;
  createdAt: string;
  updatedAt: string;
  po?: { id: string; poNumber: string; totalBudget: string };
}

export interface CreateInvoiceDto {
  invoiceNumber: string;
  poId?: string;
  amount: number;
  status?: InvoiceStatus;
  fileUrl?: string;
  fileName?: string;
}
