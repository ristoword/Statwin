import { Module } from '@nestjs/common';
import { DataProvidersModule } from '../../data-providers/data-providers.module';
import { PredictionEngineModule } from '../../prediction-engine/prediction-engine.module';
import { SportDeskModule } from '../generic/sport-desk.module';
import { BasketballController } from './basketball.controller';
import { BasketballService } from './basketball.service';
import { BasketballSyncService } from './basketball-sync.service';

@Module({
  imports: [DataProvidersModule, PredictionEngineModule, SportDeskModule],
  controllers: [BasketballController],
  providers: [BasketballService, BasketballSyncService],
  exports: [BasketballService, BasketballSyncService],
})
export class BasketballModule {}
