import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { findSport } from '../sport-catalog';

@Injectable()
export class SportDeskService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(slug: string) {
    const catalog = findSport(slug);
    const sport = await this.prisma.sport.findUnique({ where: { slug } });
    const sportId = sport?.id;
    const [competitions, teams, matches] = sportId
      ? await Promise.all([
          this.prisma.competition.count({ where: { sportId } }),
          this.prisma.team.count({ where: { sportId } }),
          this.prisma.match.count({ where: { sportId } }),
        ])
      : [0, 0, 0];

    return {
      sport: sport ?? { slug, name: catalog?.name ?? slug, isActive: false },
      catalog: catalog ?? null,
      counts: { competitions, teams, matches },
      competitions: [] as unknown[],
      events: [] as unknown[],
      note:
        catalog?.status === 'synced'
          ? 'Nessun risultato sportivo inventato. I dati arrivano dai provider dopo la sincronizzazione.'
          : 'Sport predisposto. Nessun risultato, quota o classifica viene inventato in attesa di un provider ufficiale.',
    };
  }

  competitions(slug: string) {
    return this.prisma.competition.findMany({
      where: { sport: { slug } },
      include: { seasons: true, leagues: true },
      orderBy: { name: 'asc' },
    });
  }

  async events(slug: string) {
    const include = { homeTeam: true, awayTeam: true, competition: true, sport: true } as const;
    const now = new Date();
    const where = { sport: { slug } };
    const [upcoming, recent] = await Promise.all([
      this.prisma.match.findMany({
        where: { ...where, kickoff: { gte: now } },
        include,
        orderBy: { kickoff: 'asc' },
        take: 20,
      }),
      this.prisma.match.findMany({
        where: { ...where, kickoff: { lt: now } },
        include,
        orderBy: { kickoff: 'desc' },
        take: 20,
      }),
    ]);
    return { recent, upcoming };
  }
}
