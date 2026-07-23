import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { BusinessType } from '@database/database';

export class RegisterVendorDto {
  @IsString()
  legalName!: string;

  @IsEnum(BusinessType)
  businessType!: BusinessType;

  @IsOptional()
  @IsString()
  panNumber?: string;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  msmeNumber?: string;

  @IsOptional()
  @IsString()
  cinNumber?: string;

  @IsOptional()
  @IsString()
  panDocUrl?: string;

  @IsOptional()
  @IsString()
  gstDocUrl?: string;

  @IsOptional()
  @IsString()
  msmeDocUrl?: string;

  @IsOptional()
  @IsString()
  cinDocUrl?: string;

  @IsString()
  addressLine1!: string;

  @IsOptional()
  @IsString()
  addressLine2!: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsString()
  pincode!: string;

  @IsString()
  vendorName!: string;

  @IsString()
  contactPersonName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
