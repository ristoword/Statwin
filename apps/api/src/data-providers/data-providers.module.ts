import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NoopFootballProvider } from './football/noop-football.provider';
import { OpenLigaDbProvider } from './football/openligadb.provider';
import { TheSportsDbProvider } from './football/thesportsdb.provider';
import { CompositeFootballProvider } from './football/composite-football.provider';
import { BasketballDataProvider, FootballDataProvider } from './interfaces/sports-data-provider';
import { TheSportsDbBasketballProvider } from './basketball/thesportsdb-basketball.provider';
import { TheSportsDbSportFactory } from './thesportsdb/thesportsdb-sport.provider';

export const FOOTBALL_DATA_PROVIDER = Symbol('FOOTBALL_DATA_PROVIDER');
export const BASKETBALL_DATA_PROVIDER = Symbol('BASKETBALL_DATA_PROVIDER');

@Module({
  imports: [ConfigModule],
  providers: [
    NoopFootballProvider,
    OpenLigaDbProvider,
    TheSportsDbProvider,
    CompositeFootballProvider,
    TheSportsDbBasketballProvider,
    TheSportsDbSportFactory,
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
    {
      provide: BASKETBALL_DATA_PROVIDER,
      inject: [TheSportsDbBasketballProvider],
      useFactory: (thesportsdb: TheSportsDbBasketballProvider): BasketballDataProvider => thesportsdb,
    },
  ],
  exports: [FOOTBALL_DATA_PROVIDER, BASKETBALL_DATA_PROVIDER, TheSportsDbSportFactory],
})
export class DataProvidersModule {}
