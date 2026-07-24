import {
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { BusinessModelType } from '@database/database';

export class SetBusinessModelDto {
  @IsEnum(BusinessModelType)
  businessModel!: BusinessModelType;

  @ValidateIf(
    (o) =>
      o.businessModel === 'MEDIATOR_MODEL' ||
      o.businessModel === 'HYBRID_MODEL',
  )
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercent?: number;

  @ValidateIf(
    (o) =>
      o.businessModel === 'VENDOR_MODEL' || o.businessModel === 'HYBRID_MODEL',
  )
  @IsNumber()
  @Min(0)
  @Max(100)
  markupPercent?: number;
}
