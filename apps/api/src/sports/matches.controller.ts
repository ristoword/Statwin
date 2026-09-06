import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FootballService } from './football/football.service';

@ApiTags('matches')
@Controller({ path: 'matches', version: '1' })
export class MatchesController {
  constructor(private readonly football: FootballService) {}

  @Get()
  list() {
    return this.football.matches();
  }

  @Get(':id')
  async one(@Param('id') id: string) {
    const match = await this.football.matchById(id);
    if (!match) {
      throw new NotFoundException('Partita non trovata');
    }
    return {
      disclaimer:
        'STATWIN fornisce analisi statistiche. Distingui DATI, STATISTICHE, PROBABILITÀ e ANALISI AI.',
      data: match,
      statistics: null,
      probabilities: match.predictions,
      aiAnalysis: match.aiReports,
    };
  }
}
