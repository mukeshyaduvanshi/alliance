import { Module } from '@nestjs/common';
import { WorkflowInstanceController } from './workflow-instance.controller';
import { WorkflowInstanceService } from './workflow-instance.service';

@Module({
  controllers: [WorkflowInstanceController],
  providers: [WorkflowInstanceService],
  exports: [WorkflowInstanceService],
})
export class WorkflowInstanceModule {}
