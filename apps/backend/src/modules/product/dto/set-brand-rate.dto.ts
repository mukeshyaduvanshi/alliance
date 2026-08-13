import { IsEnum, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { Region } from '@database/database';

export class SetBrandRateDto {
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
