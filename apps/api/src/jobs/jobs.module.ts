import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { AiEngineModule } from '../ai-engine/ai-engine.module';
import { DataProvidersModule } from '../data-providers/data-providers.module';
import { OddsProvidersModule } from '../odds-providers/odds-providers.module';
import { FootballModule } from '../sports/football/football.module';
import { SportsModule } from '../sports/sports.module';
import { JobsService } from './jobs.service';
import { SyncProcessor } from './sync/sync.processor';
import { SyncScheduler } from './sync/sync.scheduler';
import { StatisticsProcessor } from './statistics/statistics.processor';
import { OddsProcessor } from './odds/odds.processor';
import { AiReportsProcessor } from './ai-reports/ai-reports.processor';

@Module({
  imports: [
    AiEngineModule,
    DataProvidersModule,
    OddsProvidersModule,
    FootballModule,
    SportsModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          username: config.get<string>('redis.username'),
          password: config.get<string>('redis.password') || undefined,
          tls: config.get('redis.tls'),
          maxRetriesPerRequest: null,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'sync' },
      { name: 'statistics' },
      { name: 'odds' },
      { name: 'ai-reports' },
    ),
  ],
  providers: [JobsService, SyncProcessor, SyncScheduler, StatisticsProcessor, OddsProcessor, AiReportsProcessor],
  exports: [JobsService],
})
export class JobsModule {}
