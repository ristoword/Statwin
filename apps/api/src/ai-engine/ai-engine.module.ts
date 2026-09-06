import { Module } from '@nestjs/common';
import { PredictionEngineModule } from '../prediction-engine/prediction-engine.module';
import { StatisticsEngineModule } from '../statistics-engine/statistics-engine.module';
import { OpenAIProvider } from './providers/openai.provider';
import { AI_PROVIDER, AiEngineService } from './ai-engine.service';
import { AiController } from './ai.controller';
import { MatchContextBuilder } from './match-context.builder';
import { SchedulerTokenGuard } from './scheduler.guard';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PredictionEngineModule, StatisticsEngineModule, AuditModule],
  controllers: [AiController],
  providers: [
    OpenAIProvider,
    MatchContextBuilder,
    AiEngineService,
    SchedulerTokenGuard,
    { provide: AI_PROVIDER, useExisting: OpenAIProvider },
  ],
  exports: [AiEngineService],
})
export class AiEngineModule {}
