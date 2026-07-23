import { IsEnum, IsOptional, IsString } from 'class-validator';
import { NegotiationStatus } from '@database/database';

export class RespondNegotiationDto {
  @IsEnum(NegotiationStatus)
  status!: NegotiationStatus; // ACCEPTED or REJECTED

  @IsOptional()
  @IsString()
  responseRemarks?: string;
}
