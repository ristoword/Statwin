import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { FootballService } from '../football.service';
import { FootballSyncService } from '../football-sync.service';

@ApiTags('football')
@Controller({ path: 'football', version: '1' })
export class FootballController {
  constructor(
    private readonly football: FootballService,
    private readonly sync: FootballSyncService,
  ) {}

  @Post('sync')
  @SkipThrottle()
  runSync() {
    return this.sync.syncAll();
  }

  @Get()
  overview() {
    return this.football.overview();
  }

  @Get('matches')
  matches(@Query('competitionId') competitionId?: string) {
    return this.football.matches(competitionId);
  }

  @Get('matches/:id')
  match(@Param('id') id: string) {
    return this.football.matchById(id);
  }

  @Get('teams')
  teams() {
    return this.football.teams();
  }

  @Get('competitions')
  competitions() {
    return this.football.competitions();
  }

  @Get('standings')
  standings(@Query('competitionId') competitionId?: string) {
    return this.football.standings(competitionId);
  }
}
