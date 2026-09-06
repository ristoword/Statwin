export type PredictionInput = {
  homeStrength: number;
  awayStrength: number;
  homeAdvantage?: number;
};

export type PredictedScore = {
  layer: 'PROBABILITY';
  kind: 'model';
  home: number;
  away: number;
  homeXg: number;
  awayXg: number;
  scoreProbability: number;
  outcome: 'HOME' | 'DRAW' | 'AWAY';
  disclaimer: string;
};

export type MarketLine = {
  market: string;
  selection: string;
  probability: number;
  impliedOdds: number | null;
};

export type OverUnderLine = {
  line: number;
  over: number;
  under: number;
  impliedOver: number | null;
  impliedUnder: number | null;
};

export type PredictionOutput = {
  market: string;
  outcomes: Array<{ selection: string; probability: number; impliedOdds: number | null }>;
  markets: MarketLine[];
  overUnder: OverUnderLine[];
  btts: { yes: number; no: number; impliedYes: number | null; impliedNo: number | null };
  model: string;
  disclaimer: string;
  impliedOddsDisclaimer: string;
  predictedScore: PredictedScore;
};

export interface PredictionModel {
  readonly slug: string;
  estimate(input: PredictionInput): PredictionOutput;
}
