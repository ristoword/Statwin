import { Module } from '@nestjs/common';
import { StatisticsEngineService } from './statistics-engine.service';
import { StatisticsController } from './statistics.controller';

@Module({
  controllers: [StatisticsController],
  providers: [StatisticsEngineService],
  exports: [StatisticsEngineService],
})
export class StatisticsEngineModule {}
