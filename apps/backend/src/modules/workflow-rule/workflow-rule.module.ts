import { Module } from '@nestjs/common';
import { WorkflowRuleService } from './workflow-rule.service';
import { WorkflowRuleController } from './workflow-rule.controller';

@Module({
  controllers: [WorkflowRuleController],
  providers: [WorkflowRuleService],
  exports: [WorkflowRuleService],
})
export class WorkflowRuleModule {}
