import { Injectable } from '@nestjs/common';
import { FeatureVector, PredictionModel, ProbabilityEstimate } from '../interfaces';
import { DISCLAIMER } from '../../common/constants';

@Injectable()
export class SimpleStatisticalModel implements PredictionModel {
  readonly id = 'simple-statistical-v1';

  estimate(features: FeatureVector): ProbabilityEstimate {
    const homeStrength = features.homeWinRate * 2 + features.homeFormPoints / 15;
    const awayStrength = features.awayWinRate * 2 + features.awayFormPoints / 15;
    const drawBias = 0.8;
    const rawHome = Math.max(0.05, homeStrength);
    const rawAway = Math.max(0.05, awayStrength);
    const rawDraw = drawBias;
    const total = rawHome + rawAway + rawDraw;
    return {
      modelId: this.id,
      outcomes: {
        home: rawHome / total,
        draw: rawDraw / total,
        away: rawAway / total,
      },
      confidence: 0.35,
      disclaimer: DISCLAIMER,
    };
  }
}
