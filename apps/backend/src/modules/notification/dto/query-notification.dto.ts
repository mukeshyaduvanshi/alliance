import { IsBooleanString, IsOptional } from 'class-validator';

export class QueryNotificationDto {
  @IsOptional()
  @IsBooleanString()
  isRead?: string;
}
