import { Module } from '@nestjs/common';
import { BusinessModelService } from './business-model.service';
import { BusinessModelController } from './business-model.controller';
import { BusinessModelListController } from './business-model-list.controller';

@Module({
  controllers: [BusinessModelController, BusinessModelListController],
  providers: [BusinessModelService],
  exports: [BusinessModelService],
})
export class BusinessModelModule {}
