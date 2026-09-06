import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SportsService } from './sports.service';
import { SportsSyncCoordinator } from './generic/sports-sync.coordinator';

@ApiTags('sports')
@Controller({ path: 'sports', version: '1' })
export class SportsController {
  constructor(
    private readonly sports: SportsService,
    private readonly sync: SportsSyncCoordinator,
  ) {}

  @Get()
  list() {
    return this.sports.list();
  }

  @Post('sync')
  @SkipThrottle()
  runSync(@Query('sport') sport?: string) {
    const only = sport
      ? sport
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined;
    return this.sync.syncAll(only);
  }
}
