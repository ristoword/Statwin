import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StatisticsEngineService } from './statistics-engine.service';

@ApiTags('statistics')
@Controller({ path: 'statistics', version: '1' })
export class StatisticsController {
  constructor(private readonly engine: StatisticsEngineService) {}

  @Get('capabilities')
  capabilities() {
    return {
      engine: 'generic',
      metrics: [
        'wins',
        'draws',
        'losses',
        'winRate',
        'goalsFor',
        'goalsAgainst',
        'goalAverage',
        'cleanSheets',
        'overUnder',
        'btts',
        'homeForm',
        'awayForm',
        'last5',
        'last10',
        'headToHead',
      ],
      note: 'Motore indipendente dallo sport. I calcolatori specifici del calcio stanno nel modulo football.',
      example: this.engine.summarize({ wins: 0, draws: 0, losses: 0 }, 0, 0),
    };
  }
}
