import { Controller, Get, NotFoundException, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { BasketballService } from './basketball.service';
import { BasketballSyncService } from './basketball-sync.service';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppPlan } from '../../common/enums/roles.enum';
import { hasMinPlan } from '../../subscriptions/plan-limits';

@ApiTags('basketball')
@Controller({ path: 'basketball', version: '1' })
export class BasketballController {
  constructor(
    private readonly basketball: BasketballService,
    private readonly sync: BasketballSyncService,
  ) {}

  @Post('sync')
  @SkipThrottle()
  runSync() {
    return this.sync.syncAll();
  }

  @Get()
  overview() {
    return this.basketball.overview();
  }

  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('matches')
  matches(@Query('competitionId') competitionId?: string, @CurrentUser() user?: { plan?: string }) {
    return this.basketball.matches(competitionId, hasMinPlan(user?.plan, AppPlan.PREMIUM));
  }

  @Get('events')
  events() {
    return this.basketball.events();
  }

  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('matches/:id')
  async match(@Param('id') id: string, @CurrentUser() user?: { plan?: string }) {
    const match = await this.basketball.matchById(id);
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
    return this.basketball.teams();
  }

  @Get('competitions')
  competitions() {
    return this.basketball.competitions();
  }

  @Get('standings')
  standings(@Query('competitionId') competitionId?: string) {
    return this.basketball.standingsView(competitionId);
  }
}
