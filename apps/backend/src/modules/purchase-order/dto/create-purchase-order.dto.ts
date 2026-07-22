import { IsString, IsNumber, Min } from 'class-validator';

export class CreatePurchaseOrderDto {
  @IsString()
  poNumber!: string;

  @IsNumber()
  @Min(1)
  totalBudget!: number;
}
