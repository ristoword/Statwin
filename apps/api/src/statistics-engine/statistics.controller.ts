import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma/prisma.service';
import { StatisticsEngineService } from './statistics-engine.service';

@ApiTags('statistics')
@Controller({ path: 'statistics', version: '1' })
export class StatisticsController {
  constructor(
    private readonly engine: StatisticsEngineService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list() {
    const standings = await this.prisma.standing.findMany({
      where: { season: { isCurrent: true, competition: { sport: { slug: 'football' } } } },
      include: { team: true, season: { include: { competition: true } } },
      orderBy: { position: 'asc' },
      take: 120,
    });
    return {
      layer: 'STATISTICS',
      note: 'Statistiche calcolate solo sui DATI già in archivio. L’ANALISI AI è un livello separato.',
      items: standings.map((row) => ({
        competition: row.season.competition.name,
        team: row.team.name,
        position: row.position,
        points: row.points,
        ...this.engine.summarize(
          { wins: row.won, draws: row.drawn, losses: row.lost },
          row.goalsFor,
          row.goalsAgainst,
        ),
      })),
    };
  }

  @Get('capabilities')
  capabilities() {
    return {
      engine: 'generic',
      metrics: [
        'wins',
        'draws',
        'losses',
        'winRate',
        'goalsFor',
        'goalsAgainst',
        'goalAverage',
        'cleanSheets',
        'overUnder',
        'btts',
        'homeForm',
        'awayForm',
        'last5',
        'last10',
        'headToHead',
      ],
      note: 'Motore indipendente dallo sport. I calcolatori specifici del calcio stanno nel modulo football.',
      example: this.engine.summarize({ wins: 0, draws: 0, losses: 0 }, 0, 0),
    };
  }
}
