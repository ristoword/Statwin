import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma/prisma.service';
import { catalogPlans, effectivePlan, PLAN_LIMITS } from './plan-limits';
import { AppPlan } from '../common/enums/roles.enum';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  listPlans() {
    return catalogPlans();
  }

  getByUser(userId: string) {
    return this.prisma.subscription.findUnique({ where: { userId } });
  }

  async getMe(userId: string) {
    const subscription = await this.getByUser(userId);
    if (!subscription) {
      return null;
    }
    return {
      ...subscription,
      trialEndsAt: subscription.trialEndsAt,
      effectivePlan: effectivePlan(subscription.plan, subscription.trialEndsAt),
    };
  }

  async activate(userId: string, plan: SubscriptionPlan) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      throw new NotFoundException('Utente non trovato.');
    }
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    return this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd,
      },
      update: {
        plan,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd,
      },
    });
  }

  canUse(plan: AppPlan, feature: keyof (typeof PLAN_LIMITS)[AppPlan]) {
    return PLAN_LIMITS[plan][feature];
  }
}
