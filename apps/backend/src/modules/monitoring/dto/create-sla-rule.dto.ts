import { IsString, IsEnum, IsInt, Min } from 'class-validator';
import { OrderStatus } from '@database/database';

export class CreateSlaRuleDto {
  @IsString()
  name!: string;

  @IsEnum(OrderStatus)
  appliesToStatus!: OrderStatus;

  @IsInt()
  @Min(1)
  thresholdHours!: number;
}
