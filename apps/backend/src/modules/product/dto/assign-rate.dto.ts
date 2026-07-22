import {
  IsUUID,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { Region } from '@database/database';

export class AssignRateDto {
  @IsUUID()
  productId!: string;

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
