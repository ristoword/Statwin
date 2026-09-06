export type PredictionInput = {
  homeStrength: number;
  awayStrength: number;
  homeAdvantage?: number;
};

export type PredictionOutput = {
  market: string;
  outcomes: Array<{ selection: string; probability: number }>;
  model: string;
  disclaimer: string;
};

export interface PredictionModel {
  readonly slug: string;
  estimate(input: PredictionInput): PredictionOutput;
}
