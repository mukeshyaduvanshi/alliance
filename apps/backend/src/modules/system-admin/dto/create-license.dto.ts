import { IsUUID, IsDateString } from 'class-validator';

export class CreateLicenseDto {
  @IsUUID()
  planId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  expiryDate!: string;
}
