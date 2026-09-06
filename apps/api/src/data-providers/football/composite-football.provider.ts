import { Injectable } from '@nestjs/common';
import { FootballDataProvider } from '../interfaces/sports-data-provider';
import {
  ExternalCompetition,
  ExternalMatch,
  ExternalStanding,
  ExternalTeam,
} from '../interfaces/external-football';
import { OpenLigaDbProvider } from './openligadb.provider';
import { TheSportsDbProvider } from './thesportsdb.provider';

@Injectable()
export class CompositeFootballProvider implements FootballDataProvider {
  readonly slug = 'composite';

  constructor(
    private readonly openliga: OpenLigaDbProvider,
    private readonly thesportsdb: TheSportsDbProvider,
  ) {}

  async ping() {
    const results = await Promise.allSettled([this.openliga.ping(), this.thesportsdb.ping()]);
    const ok = results.some((result) => result.status === 'fulfilled' && result.value.ok);
    return { ok, provider: this.slug };
  }

  async fetchCompetitions(): Promise<ExternalCompetition[]> {
    const chunks = await Promise.allSettled([
      this.openliga.fetchCompetitions(),
      this.thesportsdb.fetchCompetitions(),
    ]);
    return chunks.flatMap((chunk) => (chunk.status === 'fulfilled' ? chunk.value : []));
  }

  fetchTeams(competition: ExternalCompetition): Promise<ExternalTeam[]> {
    return this.route(competition).fetchTeams(competition);
  }

  fetchMatches(competition: ExternalCompetition): Promise<ExternalMatch[]> {
    return this.route(competition).fetchMatches(competition);
  }

  fetchStandings(competition: ExternalCompetition): Promise<ExternalStanding[]> {
    const provider = this.route(competition);
    return provider.fetchStandings ? provider.fetchStandings(competition) : Promise.resolve([]);
  }

  private route(competition: ExternalCompetition): FootballDataProvider {
    return competition.externalId.startsWith('tsd:') ? this.thesportsdb : this.openliga;
  }
}
