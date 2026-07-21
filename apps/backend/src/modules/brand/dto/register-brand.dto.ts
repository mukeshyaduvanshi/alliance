import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';
import { BusinessType } from '@database/database';

export class RegisterBrandDto {
  // Business details
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

  @IsString()
  addressLine1!: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsString()
  pincode!: string;

  // Brand contact details
  @IsString()
  brandName!: string;

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
