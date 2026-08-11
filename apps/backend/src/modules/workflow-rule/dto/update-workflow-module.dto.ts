import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkflowModuleDto } from './create-workflow-module.dto';

export class UpdateWorkflowModuleDto extends PartialType(
  CreateWorkflowModuleDto,
) {}
