import { RateUnit, Region } from "../enums";

export interface RateRegionRateDto {
  id: string;
  region: Region;
  rate: string;
}

export interface RateQuoteDto {
  brandId?: string;
  brandName?: string;
  vendorId?: string;
  vendorName?: string;
  region: Region;
  rate: string;
}

export interface RateDto {
  id: string;
  tenantId: string;
  label: string;
  calcUnit: RateUnit;
  calcWidth?: string | null;
  calcHeight?: string | null;
  measUnit: RateUnit;
  measWidth?: string | null;
  measHeight?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  regions: RateRegionRateDto[];
  brandQuotes?: RateQuoteDto[];
  vendorQuotes?: RateQuoteDto[];
}

export interface CreateRateDto {
  label: string;
  calcUnit: RateUnit;
  calcWidth?: number;
  calcHeight?: number;
  measUnit: RateUnit;
  measWidth?: number;
  measHeight?: number;
  regionRates: { region: Region; rate: number }[];
}

export interface UpdateRateDto extends Partial<CreateRateDto> {}

export interface RateRegionInput {
  region: Region;
  rate: number;
}

export interface RateBrandEntryDto {
  id: string;
  rateId: string;
  region: Region;
  rate: string;
  brandId?: string;
  brandName?: string;
}

export interface RateVendorEntryDto {
  id: string;
  rateId: string;
  region: Region;
  rate: string;
  vendorId?: string;
  vendorName?: string;
}