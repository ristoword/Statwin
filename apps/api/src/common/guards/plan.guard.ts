import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppPlan } from '../enums/roles.enum';
import { effectivePlan, hasMinPlan } from '../../subscriptions/plan-limits';

export const PLANS_KEY = 'plans';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AppPlan[]>(PLANS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<{
      user?: { plan?: AppPlan | string; storedPlan?: string; trialEndsAt?: Date | string | null };
    }>();
    const plan = effectivePlan(user?.storedPlan ?? user?.plan, user?.trialEndsAt);
    const needed = required.reduce((lowest, candidate) =>
      hasMinPlan(lowest, candidate) ? candidate : lowest,
    );
    if (!hasMinPlan(plan, needed)) {
      throw new ForbiddenException('Piano di abbonamento insufficiente per questa funzione.');
    }
    return true;
  }
}
