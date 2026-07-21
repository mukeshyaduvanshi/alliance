import { IsString, IsUUID } from 'class-validator';

export class StartWorkflowDto {
  @IsString()
  module!: string; // matches WorkflowRule.module

  @IsString()
  entityType!: string; // e.g. "BrandOrder"

  @IsUUID()
  entityId!: string;
}
