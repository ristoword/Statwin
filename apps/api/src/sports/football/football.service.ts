import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class FootballService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const sport = await this.prisma.sport.findUnique({ where: { slug: 'football' } });
    const [competitions, teams, matches] = await Promise.all([
      this.prisma.competition.count({ where: { sportId: sport?.id } }),
      this.prisma.team.count({ where: { sportId: sport?.id } }),
      this.prisma.match.count({ where: { sportId: sport?.id } }),
    ]);
    return {
      sport: sport ?? { slug: 'football', name: 'Calcio', isActive: true },
      counts: { competitions, teams, matches },
      note: 'Nessun risultato sportivo inventato. I dati arrivano dai provider dopo la sincronizzazione.',
    };
  }

  async matches() {
    const include = { homeTeam: true, awayTeam: true, competition: true } as const;
    const now = new Date();
    const [upcoming, recent] = await Promise.all([
      this.prisma.match.findMany({
        where: { sport: { slug: 'football' }, kickoff: { gte: now } },
        include,
        orderBy: { kickoff: 'asc' },
        take: 20,
      }),
      this.prisma.match.findMany({
        where: { sport: { slug: 'football' }, kickoff: { lt: now } },
        include,
        orderBy: { kickoff: 'desc' },
        take: 20,
      }),
    ]);
    return [...recent, ...upcoming];
  }

  matchById(id: string) {
    return this.prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
        season: true,
        events: true,
        lineups: { include: { player: true, team: true } },
        odds: { include: { bookmaker: true, market: true } },
        predictions: true,
        aiReports: true,
      },
    });
  }

  teams() {
    return this.prisma.team.findMany({
      where: { sport: { slug: 'football' } },
      orderBy: { name: 'asc' },
    });
  }

  competitions() {
    return this.prisma.competition.findMany({
      where: { sport: { slug: 'football' } },
      include: { seasons: true, leagues: true },
    });
  }

  standings() {
    return this.prisma.standing.findMany({
      where: { season: { isCurrent: true, competition: { sport: { slug: 'football' } } } },
      include: { team: true, season: true },
      orderBy: { position: 'asc' },
    });
  }
}
