import { Module } from '@nestjs/common';
import { PREDISPOSED_SPORTS } from '../sport-catalog';
import { createSportDeskController } from './sport-desk.controller';
import { SportDeskModule } from './sport-desk.module';

@Module({
  imports: [SportDeskModule],
  controllers: PREDISPOSED_SPORTS.map((sport) => createSportDeskController(sport.slug, sport.apiPath)),
  exports: [SportDeskModule],
})
export class PredisposedSportsModule {}
