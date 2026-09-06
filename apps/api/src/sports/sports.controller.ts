import { BadRequestException, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SportsService } from './sports.service';
import { SportsSyncCoordinator } from './generic/sports-sync.coordinator';
import { SportDeskService } from './generic/sport-desk.service';
import { findSport } from './sport-catalog';

@ApiTags('sports')
@Controller({ path: 'sports', version: '1' })
export class SportsController {
  constructor(
    private readonly sports: SportsService,
    private readonly sync: SportsSyncCoordinator,
    private readonly desk: SportDeskService,
  ) {}

  @Get()
  list() {
    return this.sports.list();
  }

  @Get('standings')
  standings(@Query('sport') sport?: string, @Query('competitionId') competitionId?: string) {
    const slug = sport?.trim();
    if (!slug || !findSport(slug)) {
      throw new BadRequestException('Parametro sport obbligatorio e valido.');
    }
    return this.desk.standingsView(slug, competitionId);
  }

  @Post('sync')
  @SkipThrottle()
  runSync(@Query('sport') sport?: string, @Query('standingsOnly') standingsOnly?: string) {
    const only = sport
      ? sport
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined;
    if (standingsOnly === '1' || standingsOnly === 'true') {
      return this.sync.syncStandings(only);
    }
    return this.sync.syncAll(only);
  }
}
