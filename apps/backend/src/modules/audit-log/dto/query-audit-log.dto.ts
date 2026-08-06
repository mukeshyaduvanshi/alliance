import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { ActorType, AuditAction } from '@database/database';

export class QueryAuditLogDto {
  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsEnum(ActorType)
  actorType?: ActorType;

  @IsOptional()
  @IsString()
  actorId?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsString()
  search?: string; // free-text search on actorName/module

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  pageSize?: string;
}
