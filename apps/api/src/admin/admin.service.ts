import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../database/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.constants';
import type { RequestMeta } from '../audit/request-meta';
import type { CreateAdminUserDto } from './dto/create-user.dto';
import type { UpdateAdminUserDto } from './dto/update-user.dto';
import type { AuditQueryDto } from './dto/audit-query.dto';
import type { UsersQueryDto } from './dto/users-query.dto';

const USER_SAFE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  emailVerified: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
} satisfies Prisma.UserSelect;

type Actor = { id: string };

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly audit: AuditService,
  ) {}

  async overview() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [users, blocked, logins24h, planGroups, sports, recentAudit] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: false } }),
      this.prisma.auditLog.count({
        where: { action: AuditAction.LOGIN_SUCCESS, createdAt: { gte: since } },
      }),
      this.prisma.subscription.groupBy({ by: ['plan'], _count: true }),
      this.prisma.sport.findMany({ select: { slug: true, name: true, isActive: true } }),
      this.listAudit({ take: 12 }),
    ]);

    const plans = { FREE: 0, PREMIUM: 0, PRO: 0 };
    for (const row of planGroups) {
      plans[row.plan] = row._count;
    }

    return {
      users,
      blocked,
      logins24h,
      plans,
      subscriptions: planGroups,
      sports,
      jobs: {
        sync: 'idle',
        statistics: 'idle',
        odds: 'idle',
        aiReports: 'idle',
      },
      recentAudit: recentAudit.items,
      impersonation: {
        allowed: false,
        reason: 'L’impersonazione non è consentita. L’admin opera solo tramite API.',
      },
    };
  }

  async listUsers(query: UsersQueryDto = {}) {
    const skip = query.skip ?? 0;
    const take = query.take ?? 50;
    const q = query.q?.trim();
    const where: Prisma.UserWhereInput = {};

    if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (query.plan) {
      where.subscription = { plan: query.plan };
    }
    if (query.blocked === true) {
      where.isActive = false;
    } else if (query.blocked === false) {
      where.isActive = true;
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        select: USER_SAFE_SELECT,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_SAFE_SELECT,
        acceptedTermsAt: true,
        acceptedDisclaimerAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Utente non trovato.');
    }

    const [payments, access, aiReports, lastAudit] = await Promise.all([
      this.prisma.payment.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          plan: true,
          status: true,
          amountCents: true,
          currency: true,
          createdAt: true,
        },
      }),
      this.listAccess(id, { take: 30 }),
      this.prisma.aIReport.count({ where: { userId: id } }),
      this.prisma.auditLog.findFirst({
        where: { OR: [{ userId: id }, { actorId: id }] },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    const lastActivityAt =
      [user.lastLoginAt, lastAudit?.createdAt]
        .filter((value): value is Date => Boolean(value))
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

    return {
      profile: user,
      subscription: user.subscription,
      usage: {
        aiReports,
        payments: payments.length,
        lastActivityAt,
      },
      payments,
      access: access.items,
      impersonation: {
        allowed: false,
        reason: 'Apri come utente non è consentito. Operazioni solo via API admin.',
      },
    };
  }

  async createUser(dto: CreateAdminUserDto, actor: Actor, meta: RequestMeta) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email già registrata.');
    }

    const temporaryPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const role = dto.role ?? Role.USER;
    const currentPeriodEnd = periodEnd();

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: dto.firstName?.trim() || null,
        lastName: dto.lastName?.trim() || null,
        role,
        emailVerified: true,
        acceptedTermsAt: new Date(),
        acceptedDisclaimerAt: new Date(),
        subscription: {
          create: {
            plan: dto.plan,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodEnd,
          },
        },
      },
      select: USER_SAFE_SELECT,
    });

    await this.audit.record({
      action: AuditAction.ADMIN_USER_CREATE,
      userId: user.id,
      actorId: actor.id,
      metadata: { plan: dto.plan, role, email },
      ...meta,
    });

    return {
      user,
      temporaryPassword,
      passwordShownOnce: true,
      note: 'Copia ora. La password temporanea non viene conservata in chiaro e non sarà più visibile.',
    };
  }

  async updateUser(id: string, dto: UpdateAdminUserDto, actor: Actor, meta: RequestMeta) {
    const user = await this.requireUser(id);

    if (id === actor.id && dto.isActive === false) {
      throw new BadRequestException('Non puoi bloccare il tuo account.');
    }
    if (id === actor.id && dto.role && dto.role !== Role.ADMIN) {
      throw new BadRequestException('Non puoi rimuovere il tuo ruolo ADMIN.');
    }

    const email = dto.email?.trim().toLowerCase();
    if (email && email !== user.email) {
      const taken = await this.users.findByEmail(email);
      if (taken) {
        throw new ConflictException('Email già registrata.');
      }
    }

    const becomingBlocked = dto.isActive === false && user.isActive;
    const becomingActive = dto.isActive === true && !user.isActive;

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName !== undefined ? dto.firstName.trim() || null : undefined,
        lastName: dto.lastName !== undefined ? dto.lastName.trim() || null : undefined,
        email,
        role: dto.role,
        isActive: dto.isActive,
      },
      select: USER_SAFE_SELECT,
    });

    if (becomingBlocked) {
      await this.revokeRefreshTokens(id);
      await this.audit.record({
        action: AuditAction.ADMIN_USER_BLOCK,
        userId: id,
        actorId: actor.id,
        metadata: { email: updated.email },
        ...meta,
      });
    } else if (becomingActive) {
      await this.audit.record({
        action: AuditAction.ADMIN_USER_UNBLOCK,
        userId: id,
        actorId: actor.id,
        metadata: { email: updated.email },
        ...meta,
      });
    }

    await this.audit.record({
      action: AuditAction.ADMIN_USER_UPDATE,
      userId: id,
      actorId: actor.id,
      metadata: {
        fields: Object.keys(dto),
        email: updated.email,
      },
      ...meta,
    });

    return updated;
  }

  async setBlocked(id: string, blocked: boolean, actor: Actor, meta: RequestMeta) {
    if (id === actor.id && blocked) {
      throw new BadRequestException('Non puoi bloccare il tuo account.');
    }
    const user = await this.requireUser(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !blocked },
      select: USER_SAFE_SELECT,
    });

    if (blocked) {
      await this.revokeRefreshTokens(id);
    }

    await this.audit.record({
      action: blocked ? AuditAction.ADMIN_USER_BLOCK : AuditAction.ADMIN_USER_UNBLOCK,
      userId: id,
      actorId: actor.id,
      metadata: { email: user.email },
      ...meta,
    });

    return updated;
  }

  async regeneratePassword(id: string, actor: Actor, meta: RequestMeta) {
    await this.requireUser(id);
    const temporaryPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
    await this.revokeRefreshTokens(id);
    await this.audit.record({
      action: AuditAction.ADMIN_PASSWORD_REGEN,
      userId: id,
      actorId: actor.id,
      ...meta,
    });

    return {
      temporaryPassword,
      passwordShownOnce: true,
      note: 'Copia ora. La nuova password non viene conservata in chiaro e non sarà più visibile. Le sessioni attive sono state invalidate.',
    };
  }

  async assignPlan(id: string, plan: SubscriptionPlan, actor: Actor, meta: RequestMeta) {
    const user = await this.requireUser(id);
    const previous = user.subscription?.plan ?? 'FREE';
    const subscription = await this.subscriptionsService.activate(id, plan);
    await this.audit.record({
      action: AuditAction.ADMIN_PLAN_CHANGE,
      userId: id,
      actorId: actor.id,
      metadata: { from: previous, to: plan, email: user.email },
      ...meta,
    });
    return subscription;
  }

  async listAccess(userId: string, query: AuditQueryDto = {}) {
    await this.requireUser(userId);
    return this.listAudit({ ...query, userId });
  }

  async listAudit(query: AuditQueryDto = {}) {
    const skip = query.skip ?? 0;
    const take = query.take ?? 50;
    const email = query.email?.trim();
    const where: Prisma.AuditLogWhereInput = {};

    if (query.userId) {
      where.OR = [{ userId: query.userId }, { actorId: query.userId }];
    }
    if (query.action) {
      where.action = query.action;
    }
    if (email) {
      const emailFilter: Prisma.AuditLogWhereInput = {
        OR: [
          { user: { email: { contains: email, mode: 'insensitive' } } },
          { actor: { email: { contains: email, mode: 'insensitive' } } },
        ],
      };
      where.AND = [...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), emailFilter];
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true } },
          actor: { select: { id: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  listSubscriptions() {
    return this.prisma.subscription.findMany({
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  listPayments() {
    return this.prisma.payment.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
    });
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
      note: 'La coda sync aggiorna calcio, basket e gli altri sport TheSportsDB in sequenza (backoff 429). Intervallo: SPORTS_SYNC_INTERVAL_MS.',
    };
  }

  aiReports() {
    return this.prisma.aIReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { match: { include: { homeTeam: true, awayTeam: true } } },
    });
  }

  private async requireUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { ...USER_SAFE_SELECT },
    });
    if (!user) {
      throw new NotFoundException('Utente non trovato.');
    }
    return user;
  }

  private async revokeRefreshTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }
}

function generateTempPassword(): string {
  const raw = randomBytes(18).toString('base64url');
  return `${raw.slice(0, 8)}-${raw.slice(8, 16)}-${raw.slice(16)}`;
}

function periodEnd() {
  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  return end;
}
