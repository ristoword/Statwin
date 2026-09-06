export type Venue = 'home' | 'away' | 'neutral';

export interface OutcomeRecord {
  scored: number;
  conceded: number;
  venue: Venue;
}

export interface TeamRecordSummary {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  scored: number;
  conceded: number;
  winRate: number;
  averageScored: number;
  averageConceded: number;
  cleanSheets: number;
}

export interface FormWindow {
  lastN: number;
  results: Array<'W' | 'D' | 'L'>;
  points: number;
}
