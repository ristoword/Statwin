export interface OddsSnapshot {
  matchExternalId: string;
  bookmaker: string;
  market: string;
  selection: string;
  value: number;
  capturedAt: Date;
}

export interface OddsDataProvider {
  readonly name: string;
  fetchOdds(): Promise<OddsSnapshot[]>;
}

export const ODDS_DATA_PROVIDER = Symbol('ODDS_DATA_PROVIDER');
