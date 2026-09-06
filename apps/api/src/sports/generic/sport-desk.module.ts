import { Module } from '@nestjs/common';
import { DataProvidersModule } from '../../data-providers/data-providers.module';
import { PredictionEngineModule } from '../../prediction-engine/prediction-engine.module';
import { SportDeskService } from './sport-desk.service';
import { SportSyncService } from './sport-sync.service';

@Module({
  imports: [DataProvidersModule, PredictionEngineModule],
  providers: [SportDeskService, SportSyncService],
  exports: [SportDeskService, SportSyncService],
})
export class SportDeskModule {}
