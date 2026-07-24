import { IsString, IsInt, IsNumber, Min } from 'class-validator';

export class CreateSubscriptionPlanDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  maxUsers!: number;

  @IsInt()
  @Min(1)
  maxBrands!: number;

  @IsInt()
  @Min(1)
  maxVendors!: number;

  @IsNumber()
  @Min(0)
  priceMonthly!: number;
}
