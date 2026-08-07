import {
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateBrandBusinessProfileDto {
  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  pincode?: string;
}

export class UpdateBrandProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  brandName?: string;

  @IsOptional()
  @IsString()
  contactPersonName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  businessProfile?: UpdateBrandBusinessProfileDto;
}
