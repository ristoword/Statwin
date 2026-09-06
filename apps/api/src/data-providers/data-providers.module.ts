import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NoopFootballProvider } from './football/noop-football.provider';
import { OpenLigaDbProvider } from './football/openligadb.provider';
import { FootballDataProvider } from './interfaces/sports-data-provider';

export const FOOTBALL_DATA_PROVIDER = Symbol('FOOTBALL_DATA_PROVIDER');

@Module({
  imports: [ConfigModule],
  providers: [
    NoopFootballProvider,
    OpenLigaDbProvider,
    {
      provide: FOOTBALL_DATA_PROVIDER,
      inject: [ConfigService, OpenLigaDbProvider, NoopFootballProvider],
      useFactory: (
        config: ConfigService,
        openliga: OpenLigaDbProvider,
        noop: NoopFootballProvider,
      ): FootballDataProvider => {
        const selected = config.get<string>('football.provider') ?? 'openligadb';
        return selected === 'noop' ? noop : openliga;
      },
    },
  ],
  exports: [FOOTBALL_DATA_PROVIDER],
})
export class DataProvidersModule {}
