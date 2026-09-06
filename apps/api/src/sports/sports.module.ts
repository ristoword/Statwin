import { Module } from '@nestjs/common';
import { SportsController } from './sports.controller';
import { MatchesController } from './matches.controller';
import { SportsService } from './sports.service';
import { FootballModule } from './football/football.module';
import { BasketballModule } from './basketball/basketball.module';
import { VolleyballModule } from './volleyball/volleyball.module';
import { TennisModule } from './tennis/tennis.module';
import { HorseRacingModule } from './horse-racing/horse-racing.module';
import { BaseballModule } from './baseball/baseball.module';
import { Formula1Module } from './formula1/formula1.module';
import { PredisposedSportsModule } from './generic/predisposed-sports.module';

@Module({
  imports: [
    FootballModule,
    BasketballModule,
    PredisposedSportsModule,
    VolleyballModule,
    TennisModule,
    HorseRacingModule,
    BaseballModule,
    Formula1Module,
  ],
  controllers: [SportsController, MatchesController],
  providers: [SportsService],
  exports: [SportsService, FootballModule],
})
export class SportsModule {}
