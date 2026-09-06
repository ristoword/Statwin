export interface FeatureVector {
  homeWinRate: number;
  awayWinRate: number;
  homeFormPoints: number;
  awayFormPoints: number;
}

export interface ProbabilityEstimate {
  modelId: string;
  outcomes: {
    home: number;
    draw: number;
    away: number;
  };
  confidence: number;
  disclaimer: string;
}

export interface PredictionModel {
  readonly id: string;
  estimate(features: FeatureVector): ProbabilityEstimate;
}
