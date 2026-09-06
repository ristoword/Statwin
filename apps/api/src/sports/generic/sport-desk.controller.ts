import { Controller, Get, NotFoundException, Param, Post, Query, Type, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SportDeskService } from './sport-desk.service';
import { SportSyncService } from './sport-sync.service';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppPlan } from '../../common/enums/roles.enum';
import { hasMinPlan } from '../../subscriptions/plan-limits';

export function createSportDeskController(slug: string, path = slug): Type<unknown> {
  @ApiTags(slug)
  @Controller({ path, version: '1' })
  class GeneratedSportDeskController {
    constructor(
      private readonly desk: SportDeskService,
      private readonly sync: SportSyncService,
    ) {}

    @Post('sync')
    @SkipThrottle()
    runSync() {
      return this.sync.syncSport(slug);
    }

    @Get()
    overview() {
      return this.desk.overview(slug);
    }

    @Get('competitions')
    competitions() {
      return this.desk.competitions(slug);
    }

    @Get('events')
    events() {
      return this.desk.events(slug);
    }

    @ApiBearerAuth()
    @UseGuards(OptionalJwtAuthGuard)
    @Get('matches')
    matches(@Query('competitionId') competitionId?: string, @CurrentUser() user?: { plan?: string }) {
      return this.desk.matches(slug, competitionId, hasMinPlan(user?.plan, AppPlan.PREMIUM));
    }

    @ApiBearerAuth()
    @UseGuards(OptionalJwtAuthGuard)
    @Get('matches/:id')
    async match(@Param('id') id: string, @CurrentUser() user?: { plan?: string }) {
      const match = await this.desk.matchById(slug, id);
      if (!match) {
        throw new NotFoundException('Evento non trovato');
      }
      const canProb = hasMinPlan(user?.plan, AppPlan.PREMIUM);
      const canAi = hasMinPlan(user?.plan, AppPlan.PRO);
      return {
        ...match,
        predictions: canProb ? match.predictions : [],
        aiReports: canAi ? match.aiReports : [],
      };
    }

    @Get('teams')
    teams() {
      return this.desk.teams(slug);
    }

    @Get('standings')
    standings(@Query('competitionId') competitionId?: string) {
      return this.desk.standingsView(slug, competitionId);
    }
  }

  Object.defineProperty(GeneratedSportDeskController, 'name', {
    value: `${slug.replace(/[^a-zA-Z0-9]+/g, '')}DeskController`,
  });

  return GeneratedSportDeskController;
}
