import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  IsEnum,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ArtworkSubmissionType } from '@database/database';

export class OrderItemInput {
  @IsUUID()
  productId!: string;

  @IsNumber()
  @Min(0.01)
  quantity!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items!: OrderItemInput[];

  @IsString()
  siteLocation!: string;

  @IsEnum(ArtworkSubmissionType)
  artworkSubmissionType!: ArtworkSubmissionType;

  @IsString()
  artworkFileUrl!: string;

  @IsString()
  artworkFileName!: string;

  @IsOptional()
  @IsUUID()
  poId?: string;
}
