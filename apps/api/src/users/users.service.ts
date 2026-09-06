import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.constants';
import type { RequestMeta } from '../audit/request-meta';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { normalizePhone } from './phone';
import { effectivePlan, trialEndDate } from '../subscriptions/plan-limits';
import {
  isSchemaDriftError,
  SUBSCRIPTION_CORE_SELECT,
  USER_CORE_SELECT,
} from './schema-compat';

type UserWithSubscription = Prisma.UserGetPayload<{ include: { subscription: true } }>;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    try {
      return await this.prisma.user.findFirst({
        where: { email: { equals: normalized, mode: 'insensitive' } },
        include: { subscription: true },
      });
    } catch (error) {
      if (!isSchemaDriftError(error)) throw error;
      this.logger.warn('User query hit missing column; retrying without phone/trialEndsAt.');
      return this.findByEmailCompatible(normalized);
    }
  }

  async findById(id: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
        include: { subscription: true },
      });
    } catch (error) {
      if (!isSchemaDriftError(error)) throw error;
      this.logger.warn('User lookup hit missing column; retrying without phone/trialEndsAt.');
      return this.findByIdCompatible(id);
    }
  }

  async create(data: {
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
  }) {
    const payload = {
      email: data.email.trim().toLowerCase(),
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: Role.USER,
      acceptedTermsAt: new Date(),
      acceptedDisclaimerAt: new Date(),
    };
    try {
      return await this.prisma.user.create({
        data: {
          ...payload,
          subscription: {
            create: { plan: 'FREE', trialEndsAt: trialEndDate() },
          },
        },
        include: { subscription: true },
      });
    } catch (error) {
      if (!isSchemaDriftError(error)) throw error;
      this.logger.warn('User create hit missing column; retrying without phone/trialEndsAt.');
      return this.prisma.user.create({
        data: {
          ...payload,
          subscription: { create: { plan: 'FREE' } },
        },
        include: { subscription: true },
      });
    }
  }

  async getProfile(id: string) {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new NotFoundException('Utente non trovato.');
      }
      return this.toPublicProfile(user);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (!isSchemaDriftError(error)) throw error;
      const fallback = await this.findByIdCompatible(id);
      if (!fallback) {
        throw new NotFoundException('Utente non trovato.');
      }
      return this.toPublicProfile(fallback);
    }
  }

  async updateMe(id: string, dto: UpdateMeDto, meta: RequestMeta = {}) {
    const user = await this.requireUserRecord(id);
    const data: { email?: string; phone?: string | null } = {};
    const fields: string[] = [];

    if (dto.phone !== undefined) {
      const phone = normalizePhone(dto.phone);
      if (phone !== (user.phone ?? null)) {
        data.phone = phone;
        fields.push('phone');
      }
    }

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      if (email !== user.email) {
        if (!dto.currentPassword) {
          throw new BadRequestException('La password attuale è obbligatoria per cambiare email.');
        }
        const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!ok) {
          throw new UnauthorizedException('Password attuale non corretta.');
        }
        const taken = await this.findByEmail(email);
        if (taken && taken.id !== id) {
          throw new ConflictException('Email già in uso.');
        }
        data.email = email;
        fields.push('email');
      }
    }

    if (fields.length === 0) {
      return this.getProfile(id);
    }

    try {
      await this.prisma.user.update({ where: { id }, data });
    } catch (error) {
      if (!isSchemaDriftError(error)) throw error;
      this.logger.warn('Profile update skipped missing phone column.');
      if (!data.email) {
        return this.getProfile(id);
      }
      await this.prisma.user.update({ where: { id }, data: { email: data.email } });
    }
    await this.audit.record({
      action: AuditAction.PROFILE_UPDATE,
      userId: id,
      actorId: id,
      metadata: { fields },
      ...meta,
    });
    return this.getProfile(id);
  }

  async changePassword(id: string, dto: ChangePasswordDto, meta: RequestMeta = {}) {
    const user = await this.requireUserRecord(id);

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Password attuale non corretta.');
    }
    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException('La nuova password deve essere diversa da quella attuale.');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash: await bcrypt.hash(dto.newPassword, 10),
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId: id, revoked: false },
      data: { revoked: true },
    });
    await this.audit.record({
      action: AuditAction.PASSWORD_CHANGE,
      userId: id,
      actorId: id,
      metadata: { revokedRefreshTokens: true },
      ...meta,
    });

    return { success: true };
  }

  list(params: { skip?: number; take?: number } = {}) {
    return this.prisma.user.findMany({
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        subscription: { select: { plan: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private toPublicProfile(user: UserWithSubscription) {
    const { passwordHash, passwordResetToken, emailVerifyToken, ...safe } = user;
    const trialEndsAt = user.subscription?.trialEndsAt ?? null;
    return {
      ...safe,
      phone: 'phone' in user ? user.phone ?? null : null,
      trialEndsAt,
      effectivePlan: effectivePlan(user.subscription?.plan, trialEndsAt),
    };
  }

  private async requireUserRecord(id: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new NotFoundException('Utente non trovato.');
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (!isSchemaDriftError(error)) throw error;
      const fallback = await this.findByIdCompatible(id);
      if (!fallback) {
        throw new NotFoundException('Utente non trovato.');
      }
      return fallback;
    }
  }

  private async findByIdCompatible(id: string): Promise<UserWithSubscription | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_CORE_SELECT,
        subscription: { select: SUBSCRIPTION_CORE_SELECT },
      },
    });
    return user ? this.withOptionalColumns(user) : null;
  }

  private async findByEmailCompatible(email: string): Promise<UserWithSubscription | null> {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: {
        ...USER_CORE_SELECT,
        subscription: { select: SUBSCRIPTION_CORE_SELECT },
      },
    });
    return user ? this.withOptionalColumns(user) : null;
  }

  private withOptionalColumns(
    user: Prisma.UserGetPayload<{
      select: typeof USER_CORE_SELECT & { subscription: { select: typeof SUBSCRIPTION_CORE_SELECT } };
    }>,
  ): UserWithSubscription {
    return {
      ...user,
      phone: null,
      subscription: user.subscription
        ? { ...user.subscription, trialEndsAt: null }
        : null,
    };
  }
}
