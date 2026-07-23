import { IsEnum, IsOptional, IsString } from 'class-validator';
import { NegotiationStatus } from '@database/database';

export class RespondNegotiationDto {
  @IsEnum(NegotiationStatus)
  status!: NegotiationStatus;

  @IsOptional()
  @IsString()
  responseRemarks?: string;
}
