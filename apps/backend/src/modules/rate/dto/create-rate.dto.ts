import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RateUnit, Region } from '@database/database';

export class RateRegionInput {
  @IsEnum(Region)
  region!: Region;

  @IsNumber()
  @Min(0)
  rate!: number;
}

export class CreateRateDto {
  @IsString()
  label!: string;

  @IsEnum(RateUnit)
  calcUnit!: RateUnit;

  @IsOptional()
  @IsNumber()
  @Min(0)
  calcWidth?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  calcHeight?: number;

  @IsEnum(RateUnit)
  measUnit!: RateUnit;

  @IsOptional()
  @IsNumber()
  @Min(0)
  measWidth?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  measHeight?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RateRegionInput)
  regionRates!: RateRegionInput[];
}
