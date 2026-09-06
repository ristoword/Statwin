import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma/prisma.service';
import { UsersService } from '../../users/users.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit.constants';
import type { RequestMeta } from '../../audit/request-meta';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.acceptTerms) {
      throw new BadRequestException('Devi accettare i termini e il disclaimer di analisi statistica.');
    }
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email già registrata.');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    return this.issueTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto, meta: RequestMeta = {}) {
    const email = dto.email.trim();
    const user = await this.users.findByEmail(email);
    if (!user || !user.isActive) {
      await this.audit.record({
        action: AuditAction.LOGIN_FAIL,
        userId: user?.id,
        metadata: { email, reason: user && !user.isActive ? 'blocked' : 'unknown' },
        ...meta,
      });
      throw new UnauthorizedException('Credenziali non valide.');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      await this.audit.record({
        action: AuditAction.LOGIN_FAIL,
        userId: user.id,
        metadata: { email, reason: 'invalid_password' },
        ...meta,
      });
      throw new UnauthorizedException('Credenziali non valide.');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await this.audit.record({
      action: AuditAction.LOGIN_SUCCESS,
      userId: user.id,
      actorId: user.id,
      metadata: { email },
      ...meta,
    });
    return this.issueTokens(user.id, user.email, user.role);
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token non valido.');
    }
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });
    return this.issueTokens(stored.user.id, stored.user.email, stored.user.role);
  }

  async logout(refreshToken: string, meta: RequestMeta = {}) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
    if (stored) {
      await this.audit.record({
        action: AuditAction.LOGOUT,
        userId: stored.userId,
        actorId: stored.userId,
        ...meta,
      });
    }
    return { success: true };
  }

  async requestPasswordReset(email: string) {
    const user = await this.users.findByEmail(email);
    if (!user) {
      return { success: true };
    }
    const token = randomBytes(24).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    return { success: true, resetToken: process.env.NODE_ENV === 'production' ? undefined : token };
  }

  async resetPassword(token: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });
    if (!user) {
      throw new BadRequestException('Token di reset non valido o scaduto.');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(password, 10),
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
    return { success: true };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });
    if (!user) {
      throw new BadRequestException('Token di verifica non valido.');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null },
    });
    return { success: true };
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const accessToken = await this.jwt.signAsync({ sub: userId, email, role });
    const refreshToken = randomBytes(40).toString('hex');
    const days = 30;
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      },
    });
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      disclaimer:
        'STATWIN fornisce analisi statistiche. Le probabilità sono stime, non certezze. Non promette vincite.',
    };
  }
}
