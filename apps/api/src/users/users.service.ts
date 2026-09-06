import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.constants';
import type { RequestMeta } from '../audit/request-meta';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { normalizePhone } from './phone';
import { effectivePlan, trialEndDate } from '../subscriptions/plan-limits';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    return this.prisma.user.findFirst({
      where: { email: { equals: normalized, mode: 'insensitive' } },
      include: { subscription: true },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { subscription: true },
    });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email.trim().toLowerCase(),
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: Role.USER,
        acceptedTermsAt: new Date(),
        acceptedDisclaimerAt: new Date(),
        subscription: {
          create: { plan: 'FREE', trialEndsAt: trialEndDate() },
        },
      },
      include: { subscription: true },
    });
  }

  async getProfile(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Utente non trovato.');
    }
    const { passwordHash, passwordResetToken, emailVerifyToken, ...safe } = user;
    const trialEndsAt = user.subscription?.trialEndsAt ?? null;
    return {
      ...safe,
      trialEndsAt,
      effectivePlan: effectivePlan(user.subscription?.plan, trialEndsAt),
    };
  }

  async updateMe(id: string, dto: UpdateMeDto, meta: RequestMeta = {}) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utente non trovato.');
    }

    const data: { email?: string; phone?: string | null } = {};
    const fields: string[] = [];

    if (dto.phone !== undefined) {
      const phone = normalizePhone(dto.phone);
      if (phone !== user.phone) {
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

    await this.prisma.user.update({ where: { id }, data });
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
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utente non trovato.');
    }

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
}
