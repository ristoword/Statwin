import { Module } from '@nestjs/common';
import { NoopOddsAdapter } from './adapters/noop-odds.adapter';

export const ODDS_PROVIDER = Symbol('ODDS_PROVIDER');

@Module({
  providers: [NoopOddsAdapter, { provide: ODDS_PROVIDER, useExisting: NoopOddsAdapter }],
  exports: [ODDS_PROVIDER],
})
export class OddsProvidersModule {}
