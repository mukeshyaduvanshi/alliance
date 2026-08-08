import { Global, Module } from '@nestjs/common';
import { QueueMonitorService } from './queue-monitor.service';

@Global()
@Module({
  providers: [QueueMonitorService],
  exports: [QueueMonitorService],
})
export class QueueMonitorModule {}
