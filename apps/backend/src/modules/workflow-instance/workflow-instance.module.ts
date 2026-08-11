import { Module } from '@nestjs/common';
import { WorkflowInstanceController } from './workflow-instance.controller';
import { WorkflowInstanceService } from './workflow-instance.service';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [MonitoringModule],
  controllers: [WorkflowInstanceController],
  providers: [WorkflowInstanceService],
  exports: [WorkflowInstanceService],
})
export class WorkflowInstanceModule {}
