import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppPlan } from '../enums/roles.enum';

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
    const { user } = context.switchToHttp().getRequest<{ user?: { plan?: AppPlan } }>();
    if (!user?.plan || !required.includes(user.plan)) {
      throw new ForbiddenException('Piano di abbonamento insufficiente per questa funzione.');
    }
    return true;
  }
}
