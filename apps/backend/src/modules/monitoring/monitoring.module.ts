import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { SlaCheckJob } from './jobs/sla-check.job';

@Module({
  controllers: [MonitoringController],
  providers: [MonitoringService, SlaCheckJob],
})
export class MonitoringModule {}
