import { IsEnum, IsNumber, IsUUID, Min } from 'class-validator';
import { Region } from '@database/database';

export class AssignVendorRateDto {
  @IsUUID()
  productId!: string;

  @IsEnum(Region)
  region!: Region;

  @IsNumber()
  @Min(0)
  rate!: number;
}
