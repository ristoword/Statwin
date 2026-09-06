import {
  ExternalCompetition,
  ExternalMatch,
  ExternalStanding,
  ExternalTeam,
} from './external-football';

export interface SportsDataProvider {
  readonly slug: string;
  ping(): Promise<{ ok: boolean; provider: string }>;
}

export interface FootballDataProvider extends SportsDataProvider {
  fetchCompetitions(): Promise<ExternalCompetition[]>;
  fetchTeams(competition: ExternalCompetition): Promise<ExternalTeam[]>;
  fetchMatches(competition: ExternalCompetition): Promise<ExternalMatch[]>;
  fetchStandings?(competition: ExternalCompetition): Promise<ExternalStanding[]>;
}

export interface OddsDataProvider {
  readonly slug: string;
  syncOdds(): Promise<{ imported: number }>;
}
