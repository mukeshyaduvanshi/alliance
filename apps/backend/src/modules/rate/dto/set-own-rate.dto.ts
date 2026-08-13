import { IsEnum, IsNumber, Min } from 'class-validator';
import { Region } from '@database/database';

export class SetOwnRateDto {
  @IsEnum(Region)
  region!: Region;

  @IsNumber()
  @Min(0)
  rate!: number;
}
