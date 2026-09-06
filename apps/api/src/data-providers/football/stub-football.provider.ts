import { Injectable } from '@nestjs/common';
import { FootballDataProvider } from '../interfaces/sports-data.provider';

@Injectable()
export class StubFootballProvider implements FootballDataProvider {
  readonly sport = 'football' as const;
  readonly name = 'stub';

  async syncCompetitions() {
    return 0;
  }
  async syncTeams() {
    return 0;
  }
  async syncMatches() {
    return 0;
  }
  async syncInjuries() {
    return 0;
  }
  async syncLineups() {
    return 0;
  }
}
