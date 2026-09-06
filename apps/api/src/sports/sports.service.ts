import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { SPORT_CATALOG } from './sport-catalog';

@Injectable()
export class SportsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rows = await this.prisma.sport.findMany();
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
      };
    });
  }

  getBySlug(slug: string) {
    return this.prisma.sport.findUnique({ where: { slug } });
  }
}
