import { IsInt, IsUUID, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateWorkflowStepDto {
  @IsInt()
  @Min(1)
  stepOrder!: number;

  @IsUUID()
  approverRoleId!: string;

  @IsOptional()
  @IsUUID()
  escalationRoleId?: string;

  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;
}
