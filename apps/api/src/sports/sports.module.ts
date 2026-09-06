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
import { SportDeskModule } from './generic/sport-desk.module';
import { SportsSyncCoordinator } from './generic/sports-sync.coordinator';

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
    SportDeskModule,
  ],
  controllers: [SportsController, MatchesController],
  providers: [SportsService, SportsSyncCoordinator],
  exports: [SportsService, FootballModule, PredisposedSportsModule, SportsSyncCoordinator],
})
export class SportsModule {}
