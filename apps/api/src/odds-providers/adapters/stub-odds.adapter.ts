import { Injectable } from '@nestjs/common';
import { OddsDataProvider, OddsSnapshot } from '../interfaces/odds-data.provider';

@Injectable()
export class StubOddsAdapter implements OddsDataProvider {
  readonly name = 'stub';

  async fetchOdds(): Promise<OddsSnapshot[]> {
    return [];
  }
}
