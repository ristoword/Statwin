import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { SportDeskService } from '../generic/sport-desk.service';

@Injectable()
export class BasketballService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly desk: SportDeskService,
  ) {}

  overview() {
    return this.desk.overview('basketball');
  }

  competitions() {
    return this.desk.competitions('basketball');
  }

  events() {
    return this.desk.events('basketball');
  }

  matches(competitionId?: string, includeEstimates = false, q?: string) {
    return this.desk.matches('basketball', competitionId, includeEstimates, q);
  }

  matchById(id: string) {
    return this.prisma.match.findFirst({
      where: { id, sport: { slug: 'basketball' } },
      include: {
        sport: true,
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
      where: { sport: { slug: 'basketball' } },
      orderBy: { name: 'asc' },
    });
  }

  standings(competitionId?: string) {
    return this.desk.standings('basketball', competitionId);
  }

  standingsView(competitionId?: string) {
    return this.desk.standingsView('basketball', competitionId);
  }
}
