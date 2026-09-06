import { Module } from '@nestjs/common';
import { BaselinePoissonModel } from './models/baseline-poisson.model';
import { PREDICTION_MODEL, PredictionEngineService } from './prediction-engine.service';
import { PredictionsController } from './predictions.controller';

@Module({
  controllers: [PredictionsController],
  providers: [
    BaselinePoissonModel,
    PredictionEngineService,
    { provide: PREDICTION_MODEL, useExisting: BaselinePoissonModel },
  ],
  exports: [PredictionEngineService],
})
export class PredictionEngineModule {}
