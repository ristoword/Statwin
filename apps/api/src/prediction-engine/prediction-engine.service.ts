import { Inject, Injectable } from '@nestjs/common';
import { PredictionInput, PredictionModel } from './models/prediction-model';

export const PREDICTION_MODEL = Symbol('PREDICTION_MODEL');

@Injectable()
export class PredictionEngineService {
  constructor(@Inject(PREDICTION_MODEL) private readonly model: PredictionModel) {}

  estimate(input: PredictionInput) {
    return this.model.estimate(input);
  }
}
