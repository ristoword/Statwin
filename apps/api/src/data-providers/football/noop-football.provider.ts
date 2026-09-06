import { Injectable } from '@nestjs/common';
import { FootballDataProvider } from '../interfaces/sports-data-provider';

@Injectable()
export class NoopFootballProvider implements FootballDataProvider {
  readonly slug = 'noop-football';

  async ping() {
    return { ok: true, provider: this.slug };
  }

  async fetchCompetitions() {
    return [];
  }

  async fetchTeams() {
    return [];
  }

  async fetchMatches() {
    return [];
  }
}
