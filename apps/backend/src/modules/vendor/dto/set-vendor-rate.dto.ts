import { IsBoolean, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { Region } from '@database/database';

export class SetVendorRateDto {
  @IsEnum(Region)
  region!: Region;

  @IsOptional()
  @IsBoolean()
  isCustomRate?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  customRate?: number;
}
