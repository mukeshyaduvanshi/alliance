import { ProductStatus, Region } from "../enums";

export interface ProductCategoryDto {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  createdAt: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export interface RegionRateInput {
  region: Region;
  rate: number;
}

export interface ProductDto {
  id: string;
  tenantId: string;
  name: string;
  sku?: string | null;
  description?: string | null;
  unit?: string | null;
  categoryId?: string | null;
  category?: ProductCategoryDto | null;
  imageUrls?: string[] | null;
  status: ProductStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  brandRegionRates?: { id: string; region: Region; rate: number }[];
  vendorRegionRates?: { id: string; region: Region; rate: number }[];
}

export interface CreateProductDto {
  name: string;
  sku?: string;
  description?: string;
  unit?: string;
  categoryId?: string;
  imageUrls?: string[];
  status?: ProductStatus;
  brandRegionRates: RegionRateInput[];
  vendorRegionRates: RegionRateInput[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface UpdateRegionRatesDto {
  regionRates: RegionRateInput[];
}

export interface AssignRateDto {
  productId: string;
  region: Region;
  isCustomRate?: boolean;
  customRate?: number;
}
