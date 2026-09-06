import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NoopFootballProvider } from './football/noop-football.provider';
import { OpenLigaDbProvider } from './football/openligadb.provider';
import { TheSportsDbProvider } from './football/thesportsdb.provider';
import { CompositeFootballProvider } from './football/composite-football.provider';
import { FootballDataProvider } from './interfaces/sports-data-provider';

export const FOOTBALL_DATA_PROVIDER = Symbol('FOOTBALL_DATA_PROVIDER');

@Module({
  imports: [ConfigModule],
  providers: [
    NoopFootballProvider,
    OpenLigaDbProvider,
    TheSportsDbProvider,
    CompositeFootballProvider,
    {
      provide: FOOTBALL_DATA_PROVIDER,
      inject: [
        ConfigService,
        OpenLigaDbProvider,
        TheSportsDbProvider,
        CompositeFootballProvider,
        NoopFootballProvider,
      ],
      useFactory: (
        config: ConfigService,
        openliga: OpenLigaDbProvider,
        thesportsdb: TheSportsDbProvider,
        composite: CompositeFootballProvider,
        noop: NoopFootballProvider,
      ): FootballDataProvider => {
        const selected = config.get<string>('football.provider') ?? 'composite';
        if (selected === 'noop') return noop;
        if (selected === 'openligadb') return openliga;
        if (selected === 'thesportsdb') return thesportsdb;
        return composite;
      },
    },
  ],
  exports: [FOOTBALL_DATA_PROVIDER],
})
export class DataProvidersModule {}
