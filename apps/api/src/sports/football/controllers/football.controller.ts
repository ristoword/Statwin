import { Controller, Get, NotFoundException, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { FootballService } from '../football.service';
import { FootballSyncService } from '../football-sync.service';
import { OptionalJwtAuthGuard } from '../../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AppPlan } from '../../../common/enums/roles.enum';
import { hasMinPlan } from '../../../subscriptions/plan-limits';

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

  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('matches')
  matches(
    @Query('competitionId') competitionId?: string,
    @Query('q') q?: string,
    @CurrentUser() user?: { plan?: string },
  ) {
    return this.football.matches(competitionId, hasMinPlan(user?.plan, AppPlan.PREMIUM), q);
  }

  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('matches/:id')
  async match(@Param('id') id: string, @CurrentUser() user?: { plan?: string }) {
    const match = await this.football.matchById(id);
    if (!match) {
      throw new NotFoundException('Partita non trovata');
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
    return this.football.teams();
  }

  @Get('competitions')
  competitions() {
    return this.football.competitions();
  }

  @Get('standings')
  standings(@Query('competitionId') competitionId?: string) {
    return this.football.standingsView(competitionId);
  }
}
