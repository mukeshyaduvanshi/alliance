import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ProposeNegotiationDto {
  @IsNumber()
  @Min(0)
  proposedAmount!: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}
