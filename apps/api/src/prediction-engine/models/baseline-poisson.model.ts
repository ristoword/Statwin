import { Injectable } from '@nestjs/common';
import { PredictionInput, PredictionModel, PredictionOutput } from './prediction-model';

const DISCLAIMER = 'Stima statistica, non una certezza. Non costituisce consiglio di scommessa.';

@Injectable()
export class BaselinePoissonModel implements PredictionModel {
  readonly slug = 'baseline-poisson';

  estimate(input: PredictionInput): PredictionOutput {
    const homeAdv = input.homeAdvantage ?? 0.1;
    const home = Math.max(0.01, input.homeStrength + homeAdv);
    const away = Math.max(0.01, input.awayStrength);
    const draw = (home + away) / 4;
    const total = home + away + draw;
    return {
      market: '1X2',
      model: this.slug,
      disclaimer: DISCLAIMER,
      outcomes: [
        { selection: 'HOME', probability: Number((home / total).toFixed(4)) },
        { selection: 'DRAW', probability: Number((draw / total).toFixed(4)) },
        { selection: 'AWAY', probability: Number((away / total).toFixed(4)) },
      ],
    };
  }
}
