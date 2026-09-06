import { Injectable } from '@nestjs/common';
import { OddsProviderAdapter, OddsSnapshot } from '../interfaces/odds-provider';

@Injectable()
export class NoopOddsAdapter implements OddsProviderAdapter {
  readonly slug = 'noop-odds';

  async fetchLatest(): Promise<OddsSnapshot[]> {
    return [];
  }
}
