import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './database/prisma/prisma.module';
import { RedisModule } from './database/redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { SportsModule } from './sports/sports.module';
import { StatisticsEngineModule } from './statistics-engine/statistics-engine.module';
import { PredictionEngineModule } from './prediction-engine/prediction-engine.module';
import { AiEngineModule } from './ai-engine/ai-engine.module';
import { DataProvidersModule } from './data-providers/data-providers.module';
import { OddsProvidersModule } from './odds-providers/odds-providers.module';
import { JobsModule } from './jobs/jobs.module';
import { HealthModule } from './health/health.module';
import { LiveModule } from './live/live.module';
import { appConfig, databaseConfig, redisConfig, aiConfig, paymentsConfig, footballConfig, basketballConfig, sportsSyncConfig } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      load: [appConfig, databaseConfig, redisConfig, aiConfig, paymentsConfig, footballConfig, basketballConfig, sportsSyncConfig],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    PaymentsModule,
    NotificationsModule,
    AdminModule,
    SportsModule,
    StatisticsEngineModule,
    PredictionEngineModule,
    AiEngineModule,
    DataProvidersModule,
    OddsProvidersModule,
    JobsModule,
    HealthModule,
    LiveModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
