import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { SPORT_CATALOG } from './sport-catalog';

@Injectable()
export class SportsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rows = await this.prisma.sport.findMany({
      include: {
        _count: { select: { competitions: true, teams: true, matches: true } },
      },
    });
    const bySlug = new Map(rows.map((row) => [row.slug, row]));
    return SPORT_CATALOG.map((item) => {
      const row = bySlug.get(item.slug);
      return {
        id: row?.id ?? null,
        slug: item.slug,
        name: row?.name ?? item.name,
        isActive: row?.isActive ?? false,
        href: item.href,
        status: item.status,
        focus: item.focus,
        blurb: item.blurb,
        eventNoun: item.eventNoun,
        counts: {
          competitions: row?._count.competitions ?? 0,
          teams: row?._count.teams ?? 0,
          matches: row?._count.matches ?? 0,
        },
      };
    });
  }

  getBySlug(slug: string) {
    return this.prisma.sport.findUnique({ where: { slug } });
  }

  async listMatches(sportSlug?: string) {
    const include = { homeTeam: true, awayTeam: true, competition: true, sport: true } as const;
    const now = new Date();
    const where = sportSlug ? { sport: { slug: sportSlug } } : {};
    const [upcoming, recent] = await Promise.all([
      this.prisma.match.findMany({
        where: { ...where, kickoff: { gte: now } },
        include,
        orderBy: { kickoff: 'asc' },
        take: 30,
      }),
      this.prisma.match.findMany({
        where: { ...where, kickoff: { lt: now } },
        include,
        orderBy: { kickoff: 'desc' },
        take: 30,
      }),
    ]);
    return { recent, upcoming };
  }
}
