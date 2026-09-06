import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { PLAN_LIMITS } from './plan-limits';
import { AppPlan } from '../common/enums/roles.enum';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  listPlans() {
    return Object.entries(PLAN_LIMITS).map(([plan, limits]) => ({
      plan,
      limits,
    }));
  }

  getByUser(userId: string) {
    return this.prisma.subscription.findUnique({ where: { userId } });
  }

  canUse(plan: AppPlan, feature: keyof (typeof PLAN_LIMITS)[AppPlan]) {
    return PLAN_LIMITS[plan][feature];
  }
}
