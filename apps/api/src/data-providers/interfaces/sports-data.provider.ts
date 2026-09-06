export interface SportsDataProvider {
  readonly sport: string;
  readonly name: string;
  syncCompetitions(): Promise<number>;
  syncTeams(): Promise<number>;
  syncMatches(): Promise<number>;
}

export interface FootballDataProvider extends SportsDataProvider {
  sport: 'football';
  syncInjuries(): Promise<number>;
  syncLineups(): Promise<number>;
}

export const FOOTBALL_DATA_PROVIDER = Symbol('FOOTBALL_DATA_PROVIDER');
