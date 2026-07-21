import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateWorkflowRuleDto {
  @IsString()
  name!: string;

  @IsString()
  module!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  autoApprove?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  escalationHours?: number;
}
