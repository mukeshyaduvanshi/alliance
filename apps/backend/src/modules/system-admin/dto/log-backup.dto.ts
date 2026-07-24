import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { BackupStatus } from '@database/database';

export class LogBackupDto {
  @IsEnum(BackupStatus)
  status!: BackupStatus;

  @IsOptional()
  @IsNumber()
  fileSizeMb?: number;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}
