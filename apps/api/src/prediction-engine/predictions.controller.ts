import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { PredictionEngineService } from './prediction-engine.service';

class EstimateDto {
  @IsNumber()
  homeStrength!: number;

  @IsNumber()
  awayStrength!: number;
}

@ApiTags('predictions')
@Controller({ path: 'predictions', version: '1' })
export class PredictionsController {
  constructor(private readonly engine: PredictionEngineService) {}

  @Post('estimate')
  estimate(@Body() dto: EstimateDto) {
    return {
      layer: 'PROBABILITY',
      ...this.engine.estimate(dto),
    };
  }
}
