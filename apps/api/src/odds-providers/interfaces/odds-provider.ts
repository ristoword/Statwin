export type OddsSnapshot = {
  matchExternalId: string;
  bookmaker: string;
  market: string;
  selection: string;
  price: number;
  capturedAt: Date;
};

export interface OddsProviderAdapter {
  readonly slug: string;
  fetchLatest(): Promise<OddsSnapshot[]>;
}
