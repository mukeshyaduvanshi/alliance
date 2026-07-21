import { IsNumber, IsUUID, Min } from 'class-validator';

export class AssignRateDto {
  @IsUUID()
  productId!: string;

  @IsNumber()
  @Min(0)
  rate!: number;
}
