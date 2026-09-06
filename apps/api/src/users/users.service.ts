import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
          create: { plan: 'FREE' },
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
    return safe;
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
