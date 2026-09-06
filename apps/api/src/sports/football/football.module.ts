import { Module } from '@nestjs/common';
import { DataProvidersModule } from '../../data-providers/data-providers.module';
import { PredictionEngineModule } from '../../prediction-engine/prediction-engine.module';
import { FootballController } from './controllers/football.controller';
import { FootballService } from './football.service';
import { FootballSyncService } from './football-sync.service';

@Module({
  imports: [DataProvidersModule, PredictionEngineModule],
  controllers: [FootballController],
  providers: [FootballService, FootballSyncService],
  exports: [FootballService, FootballSyncService],
})
export class FootballModule {}
