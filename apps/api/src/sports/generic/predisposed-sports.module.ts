import { Module } from '@nestjs/common';
import { SPORT_CATALOG } from '../sport-catalog';
import { createSportDeskController } from './sport-desk.controller';
import { SportDeskModule } from './sport-desk.module';

const DESK_SPORTS = SPORT_CATALOG.filter((sport) => sport.slug !== 'football' && sport.slug !== 'basketball');

@Module({
  imports: [SportDeskModule],
  controllers: DESK_SPORTS.map((sport) => createSportDeskController(sport.slug, sport.apiPath)),
  exports: [SportDeskModule],
})
export class PredisposedSportsModule {}
