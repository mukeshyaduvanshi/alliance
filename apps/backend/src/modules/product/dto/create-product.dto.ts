import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus, Region } from '@database/database';

export class RegionRateInput {
  @IsEnum(Region)
  region!: Region;

  @IsNumber()
  @Min(0)
  rate!: number;
}

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegionRateInput)
  brandRegionRates!: RegionRateInput[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegionRateInput)
  vendorRegionRates!: RegionRateInput[];
}
