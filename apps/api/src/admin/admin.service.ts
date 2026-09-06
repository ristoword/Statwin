import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  overview() {
    return Promise.all([
      this.prisma.user.count(),
      this.prisma.subscription.count(),
      this.prisma.payment.count(),
      this.prisma.sport.count(),
      this.prisma.match.count(),
      this.prisma.aIReport.count(),
    ]).then(([users, subscriptions, payments, sports, matches, aiReports]) => ({
      users,
      subscriptions,
      payments,
      sports,
      matches,
      aiReports,
    }));
  }

  listUsers() {
    return this.users.list();
  }

  subscriptions() {
    return this.prisma.subscription.findMany({ include: { user: { select: { email: true } } } });
  }

  payments() {
    return this.prisma.payment.findMany({ include: { user: { select: { email: true } } } });
  }

  sports() {
    return this.prisma.sport.findMany();
  }

  competitions() {
    return this.prisma.competition.findMany({ include: { sport: true } });
  }

  providers() {
    return this.prisma.oddsProvider.findMany();
  }

  jobs() {
    return {
      queues: ['sync', 'statistics', 'odds', 'ai-reports'],
      note: 'I job sono predisposti. Nessuna sincronizzazione automatica è attiva senza provider.',
    };
  }

  aiReports() {
    return this.prisma.aIReport.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  }
}
