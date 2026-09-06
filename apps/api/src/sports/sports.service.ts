import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class SportsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.sport.findMany({ orderBy: { name: 'asc' } });
  }

  getBySlug(slug: string) {
    return this.prisma.sport.findUnique({ where: { slug } });
  }
}
