import { IsEnum, IsUUID } from 'class-validator';
import { Region } from '@database/database';

export class SelectRateDto {
  @IsUUID()
  productId!: string;

  @IsEnum(Region)
  region!: Region;
}
