import { Injectable } from '@nestjs/common';
import { calculateGoalAverage, calculateWinRate, ResultRecord } from './calculators/record.calculator';

@Injectable()
export class StatisticsEngineService {
  summarize(record: ResultRecord, goalsFor: number, goalsAgainst: number) {
    const played = record.wins + record.draws + record.losses;
    return {
      played,
      ...record,
      winRate: calculateWinRate(record),
      goalsFor,
      goalsAgainst,
      goalAverage: calculateGoalAverage(goalsFor, played),
      layer: 'STATISTICS',
    };
  }
}
