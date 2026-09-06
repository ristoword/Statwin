import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FootballService } from './football/football.service';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AppPlan } from '../common/enums/roles.enum';
import { hasMinPlan } from '../subscriptions/plan-limits';

@ApiTags('matches')
@Controller({ path: 'matches', version: '1' })
export class MatchesController {
  constructor(private readonly football: FootballService) {}

  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  list(@CurrentUser() user?: { plan?: string }) {
    return this.football.matches(undefined, hasMinPlan(user?.plan, AppPlan.PREMIUM));
  }

  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async one(@Param('id') id: string, @CurrentUser() user?: { plan?: string }) {
    const match = await this.football.matchById(id);
    if (!match) {
      throw new NotFoundException('Partita non trovata');
    }
    const canProb = hasMinPlan(user?.plan, AppPlan.PREMIUM);
    const canAi = hasMinPlan(user?.plan, AppPlan.PRO);
    return {
      disclaimer:
        'STATWIN fornisce analisi statistiche. Distingui DATI, STATISTICHE, PROBABILITÀ e ANALISI AI. 18+.',
      data: {
        ...match,
        predictions: canProb ? match.predictions : [],
        aiReports: canAi ? match.aiReports : [],
      },
      statistics: null,
      probabilities: canProb ? match.predictions : { locked: true, requiredPlan: 'PREMIUM' },
      aiAnalysis: canAi ? match.aiReports : { locked: true, requiredPlan: 'PRO' },
      analysisUrl: `/api/v1/ai/matches/${match.id}`,
    };
  }
}
